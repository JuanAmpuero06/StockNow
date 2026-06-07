import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import TypeAdapter

from app.core.database import get_db
from app.core.redis import get_redis
from app.repositories.product import ProductRepository
from app.schemas.product import *

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
    Retorna el catálogo con estrategia Cache-Aside e hidratación estricta de Pydantic v2.
    """
    cache_key = f"products:all:skip={skip}:limit={limit}"
    
    # 1. Intentar leer de Redis (Cache Hit)
    cached_products = cache.get(cache_key)
    if cached_products:
        return products_adapter.validate_json(cached_products)
        
    # 2. Si no está en Redis (Cache Miss), ir a PostgreSQL
    products = repo.list(skip=skip, limit=limit)
    
    # ⚡ CORRECCIÓN CRUCIAL: Convertir los modelos de SQLAlchemy a modelos de Pydantic
    # Aquí es donde 'from_attributes=True' hace su magia de forma explícita
    pydantic_products = products_adapter.validate_python(products)
    
    # 3. Ahora que son objetos Pydantic puros, los serializamos a JSON de forma segura para Redis
    json_data = products_adapter.dump_json(pydantic_products).decode("utf-8")
    cache.setex(cache_key, 300, json_data)
    
    return pydantic_products


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

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis)
):
    """Actualiza un producto e invalida la caché de listados"""
    updated_product = repo.update(product_id, payload)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    # ⚡ Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete: cache.delete(*keys_to_delete)
        
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis)
):
    """Elimina un producto de forma permanente e invalida la caché"""
    success = repo.delete(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    # ⚡ Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete: cache.delete(*keys_to_delete)
        
    return None