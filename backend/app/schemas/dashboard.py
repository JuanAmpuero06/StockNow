from pydantic import BaseModel
from decimal import Decimal

class DashboardStats(BaseModel):
    total_products: int
    low_stock_count: int
    pending_orders: int
    total_sales: Decimal

    class Config:
        from_attributes = True
