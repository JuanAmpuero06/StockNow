from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.redis import get_redis  # 1. Importar la dependencia de Redis
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_order_repository(db: Session = Depends(get_db)) -> OrderRepository:
    return OrderRepository(db)

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate, 
    repo: OrderRepository = Depends(get_order_repository),
    cache = Depends(get_redis)  # 2. Inyectar el cliente de caché
):
    """
    Registra una nueva orden en el sistema, calcula totales, reserva stock y limpia la caché de productos.
    """
    current_user_id = 1 
    # Ejecuta la transacción en la BD
    order = repo.create_order(user_id=current_user_id, obj_in=payload)
    
    # ⚡ INVALIDACIÓN DE CACHÉ DE PRODUCTOS:
    # Como el stock cambió en la BD, borramos los listados cacheados en Redis
    # para obligar a la app a leer los datos frescos en la próxima recarga.
    keys_to_delete = cache.keys("products:all:*")
    if keys_to_delete:
        cache.delete(*keys_to_delete)
        
    return order