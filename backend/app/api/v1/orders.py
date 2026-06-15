from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.redis import get_redis  # 1. Importar la dependencia de Redis
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCreate, OrderResponse
from app.api.v1.deps import get_current_user, RoleChecker
from app.models.domain import User

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_order_repository(db: Session = Depends(get_db)) -> OrderRepository:
    return OrderRepository(db)

async def broadcast_stock_update(product_ids: list):
    from app.core.websocket import manager
    from app.core.database import SessionLocal
    from app.repositories.product import ProductRepository
    from app.schemas.product import ProductResponse

    with SessionLocal() as db_session:
        prod_repo = ProductRepository(db_session)
        updated_products = []
        for pid in product_ids:
            prod = prod_repo.get_by_id(pid)
            if prod:
                pydantic_prod = ProductResponse.model_validate(prod)
                updated_products.append(pydantic_prod.model_dump(mode='json'))
        
        if updated_products:
            await manager.broadcast({
                "type": "STOCK_UPDATE",
                "products": updated_products
            })

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate, 
    background_tasks: BackgroundTasks,
    repo: OrderRepository = Depends(get_order_repository),
    cache = Depends(get_redis),  # 2. Inyectar el cliente de caché
    current_user: User = Depends(RoleChecker(["user"]))
):
    """
    Registra una nueva orden en el sistema, calcula totales, reserva stock y limpia la caché de productos.
    """
    # Ejecuta la transacción en la BD
    order = repo.create_order(user_id=current_user.id, obj_in=payload)
    
    # ⚡ INVALIDACIÓN DE CACHÉ DE PRODUCTOS:
    # Como el stock cambió en la BD, borramos los listados cacheados en Redis
    # para obligar a la app a leer los datos frescos en la próxima recarga.
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete:
        cache.delete(*keys_to_delete)
        
    # 🚀 REAL-TIME SYNC: Transmitir stocks actualizados y nueva orden mediante WebSockets
    product_ids = [item.product_id for item in payload.items]
    background_tasks.add_task(broadcast_stock_update, product_ids)
    background_tasks.add_task(broadcast_order_update, order.id, "ORDER_CREATED")
        
    return order

from typing import List
from pydantic import BaseModel

class StatusUpdatePayload(BaseModel):
    status: str

async def broadcast_order_update(order_id: int, event_type: str = "ORDER_UPDATED"):
    from app.core.websocket import manager
    from app.core.database import SessionLocal
    from app.models.domain import Order
    from app.schemas.order import OrderResponse
    from sqlalchemy.orm import joinedload

    with SessionLocal() as db_session:
        order = db_session.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
        if order:
            pydantic_order = OrderResponse.model_validate(order)
            await manager.broadcast({
                "type": event_type,
                "order": pydantic_order.model_dump(mode='json')
            })

@router.get("/", response_model=List[OrderResponse])
def list_orders(
    skip: int = 0,
    limit: int = 100,
    repo: OrderRepository = Depends(get_order_repository),
    current_user: User = Depends(RoleChecker(["admin", "manager", "operator"]))
):
    """
    Retorna la cola de órdenes del sistema para procesamiento o consulta.
    """
    from app.models.domain import Order
    from sqlalchemy.orm import joinedload
    orders = (
        repo.db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: StatusUpdatePayload,
    background_tasks: BackgroundTasks,
    repo: OrderRepository = Depends(get_order_repository),
    cache = Depends(get_redis),
    current_user: User = Depends(RoleChecker(["admin", "manager", "operator"]))
):
    """
    Actualiza el estado de una orden. Si cambia a completed o cancelled,
    descuenta stock físico o libera la reserva respectivamente en Postgres,
    limpia caché en Redis y notifica los cambios en tiempo real vía WebSockets.
    """
    order = repo.update_order_status(order_id=order_id, status_str=payload.status)

    # Invalida Redis
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete:
        cache.delete(*keys_to_delete)

    # Emitir por WebSockets
    product_ids = [item.product_id for item in order.items]
    background_tasks.add_task(broadcast_stock_update, product_ids)
    background_tasks.add_task(broadcast_order_update, order.id, "ORDER_UPDATED")

    return order