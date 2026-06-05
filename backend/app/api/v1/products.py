import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import TypeAdapter

from app.core.database import get_db
from app.core.redis import get_redis
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])

def get_product_repository(db: Session = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

# Creamos un adaptador de Pydantic para manejar listas de ProductResponse de forma nativa
products_adapter = TypeAdapter(List[ProductResponse])


@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis)
):
    """
    Retorna el catálogo con estrategia Cache-Aside.
    """
    # 1. Definir una llave única en Redis basada en la paginación
    cache_key = f"products:all:skip={skip}:limit={limit}"
    
    # 2. Intentar leer de Redis (Cache Hit)
    cached_products = cache.get(cache_key)
    if cached_products:
        # Deserializamos el JSON string directamente a objetos de Pydantic
        return products_adapter.validate_json(cached_products)
        
    # 3. Si no está en Redis (Cache Miss), ir a PostgreSQL
    products = repo.list(skip=skip, limit=limit)
    
    # 4. Guardar el resultado en Redis serializado como JSON string
    # Le asignamos un TTL (Time to Live) de 300 segundos (5 minutos) para que expire solo
    json_data = products_adapter.dump_json(products).decode("utf-8")
    cache.setex(cache_key, 300, json_data)
    
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate, 
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis)
):
    """
    Registra un producto e invalida la caché existente.
    """
    existing_product = repo.get_by_sku(payload.sku)
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El SKU '{payload.sku}' ya está registrado."
        )
        
    new_product = repo.create(payload)
    
    # ⚡ INVALIDACIÓN DE CACHÉ (Buenas prácticas avanzadas)
    # Al agregar un nuevo producto, todas nuestras cachés de listados quedan obsoletas.
    # Buscamos todas las llaves que empiecen con "products:all:" y las eliminamos.
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete:
        cache.delete(*keys_to_delete)
        
    return new_product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int, 
    repo: ProductRepository = Depends(get_product_repository)
):
    """
    Obtiene los detalles de un producto específico mediante su ID.
    """
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado."
        )
    return product
