from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, Field, ConfigDict
from app.models.domain import OrderStatus

# Lo que el frontend envía en el cuerpo de la petición para un ítem
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="La cantidad debe ser mayor a 0")

# Lo que el frontend envía para crear la orden completa
class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="La orden debe tener al menos un ítem")

# Estructura del ítem en la respuesta
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)

# La respuesta completa de la orden
class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)