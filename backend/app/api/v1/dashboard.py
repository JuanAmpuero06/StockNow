from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.domain import Product, Inventory, Order, OrderStatus
from app.schemas.dashboard import DashboardStats
from app.api.v1.deps import RoleChecker

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["admin", "manager", "operator"]))
):
    """
    Retorna métricas consolidadas en tiempo real del inventario y las ventas.
    Disponible para administradores, gestores y operadores.
    """
    total_products = db.query(Product).count()
    
    # Stock disponible = quantity - reserved_quantity
    low_stock_count = (
        db.query(Inventory)
        .filter((Inventory.quantity - Inventory.reserved_quantity) <= Inventory.min_stock_threshold)
        .count()
    )
    
    pending_orders = (
        db.query(Order)
        .filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.PROCESSING]))
        .count()
    )
    
    # Sumar montos de órdenes completadas
    total_sales = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status == OrderStatus.COMPLETED)
        .scalar()
    ) or 0.0
    
    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "pending_orders": pending_orders,
        "total_sales": total_sales
    }
