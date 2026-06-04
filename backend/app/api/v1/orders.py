from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_order_repository(db: Session = Depends(get_db)) -> OrderRepository:
    return OrderRepository(db)

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate, 
    repo: OrderRepository = Depends(get_order_repository)
):
    """
    Registra una nueva orden en el sistema, calcula totales y reserva stock de forma segura.
    """
    # Simulamos el ID del usuario que realiza la compra por ahora
    current_user_id = 1 
    return repo.create_order(user_id=current_user_id, obj_in=payload)