import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import TypeAdapter

from app.core.database import get_db
from app.core.redis import get_redis
from app.repositories.product import ProductRepository
from app.schemas.product import *
from app.api.v1.deps import RoleChecker

router = APIRouter(prefix="/products", tags=["Products"])

def get_product_repository(db: Session = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

# Creamos un adaptador de Pydantic para manejar listas de ProductResponse de forma nativa
products_adapter = TypeAdapter(List[ProductResponse])

async def broadcast_product_change(event_type: str, product_id: int):
    from app.core.websocket import manager
    from app.core.database import SessionLocal
    from app.repositories.product import ProductRepository
    from app.schemas.product import ProductResponse

    with SessionLocal() as db_session:
        prod_repo = ProductRepository(db_session)
        prod = prod_repo.get_by_id(product_id)
        if prod:
            pydantic_prod = ProductResponse.model_validate(prod)
            await manager.broadcast({
                "type": event_type,
                "product": pydantic_prod.model_dump(mode='json')
            })

async def broadcast_product_deletion(product_id: int):
    from app.core.websocket import manager
    await manager.broadcast({
        "type": "PRODUCT_DELETED",
        "product_id": product_id
    })


@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    low_stock: bool = Query(False),
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis)
):
    """
    Retorna el catálogo con estrategia Cache-Aside e hidratación estricta de Pydantic v2.
    """
    cache_key = f"products:all:skip={skip}:limit={limit}:search={search or ''}:low_stock={low_stock}"
    
    # 1. Intentar leer de Redis (Cache Hit)
    cached_products = cache.get(cache_key)
    if cached_products:
        return products_adapter.validate_json(cached_products)
        
    # 2. Si no está en Redis (Cache Miss), ir a PostgreSQL
    products = repo.list(skip=skip, limit=limit, search=search, low_stock=low_stock)
    
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
    background_tasks: BackgroundTasks,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis),
    current_user = Depends(RoleChecker(["admin", "manager"]))
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
        
    # 🚀 REAL-TIME: Transmitir creación de producto
    background_tasks.add_task(broadcast_product_change, "PRODUCT_CREATED", new_product.id)
        
    return new_product


@router.get("/audit-logs", response_model=List[InventoryAuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["admin", "manager", "operator"]))
):
    """
    Retorna el historial de auditoría de movimientos físicos de stock.
    """
    from app.models.domain import InventoryAuditLog
    from sqlalchemy.orm import joinedload
    
    logs = (
        db.query(InventoryAuditLog)
        .options(
            joinedload(InventoryAuditLog.product),
            joinedload(InventoryAuditLog.user)
        )
        .order_by(InventoryAuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs


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
    background_tasks: BackgroundTasks,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis),
    current_user = Depends(RoleChecker(["admin", "manager"]))
):
    """Actualiza un producto e invalida la caché de listados"""
    updated_product = repo.update(product_id, payload)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    # ⚡ Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete: cache.delete(*keys_to_delete)
    
    # 🚀 REAL-TIME: Transmitir actualización de producto
    background_tasks.add_task(broadcast_product_change, "PRODUCT_UPDATED", updated_product.id)
        
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    background_tasks: BackgroundTasks,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis),
    current_user = Depends(RoleChecker(["admin"]))
):
    """Elimina un producto de forma permanente e invalida la caché"""
    success = repo.delete(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    # ⚡ Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete: cache.delete(*keys_to_delete)
    
    # 🚀 REAL-TIME: Transmitir eliminación de producto
    background_tasks.add_task(broadcast_product_deletion, product_id)
        
    return None

from pydantic import BaseModel

class StockAdjustmentPayload(BaseModel):
    quantity: int
    reason: Optional[str] = Field("Ajuste manual de stock", max_length=255)

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    payload: StockAdjustmentPayload,
    background_tasks: BackgroundTasks,
    repo: ProductRepository = Depends(get_product_repository),
    cache = Depends(get_redis),
    current_user = Depends(RoleChecker(["admin", "manager", "operator"]))
):
    """
    Ajusta manualmente el stock físico de un producto (entrada o salida).
    Disponible para todos los roles (los operadores pueden reportar discrepancias físicas en bodega).
    """
    db_product = repo.get_by_id(product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    
    if not db_product.inventory:
        raise HTTPException(status_code=400, detail="Este producto no tiene un registro de inventario.")

    # Modificar stock físico
    db_product.inventory.quantity += payload.quantity
    if db_product.inventory.quantity < 0:
        raise HTTPException(status_code=400, detail="El stock físico resultante no puede ser negativo.")

    # 📝 REGISTRO DE AUDITORÍA
    from app.models.domain import InventoryAuditLog
    audit_log = InventoryAuditLog(
        product_id=product_id,
        user_id=current_user.id,
        quantity_changed=payload.quantity,
        reason=payload.reason or "Ajuste manual de stock"
    )
    repo.db.add(audit_log)
    repo.db.commit()

    # Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete: cache.delete(*keys_to_delete)

    # Emitir por WebSocket
    background_tasks.add_task(broadcast_product_change, "PRODUCT_UPDATED", product_id)

    return db_product