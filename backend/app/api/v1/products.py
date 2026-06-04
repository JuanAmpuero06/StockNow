from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])

# Dependencia para obtener el repositorio listo para usar
def get_product_repository(db: Session = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate, 
    repo: ProductRepository = Depends(get_product_repository)
):
    """
    Registra un nuevo producto en el catálogo e inicializa su inventario de forma atómica.
    """
    existing_product = repo.get_by_sku(payload.sku)
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El SKU '{payload.sku}' ya está registrado."
        )
    return repo.create(payload)

@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(10, ge=1, le=100, description="Máximo de registros a retornar"),
    repo: ProductRepository = Depends(get_product_repository)
):
    """
    Retorna el catálogo de productos con soporte de paginación para optimizar el rendimiento.
    """
    return repo.list(skip=skip, limit=limit)

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