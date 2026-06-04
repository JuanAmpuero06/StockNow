from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Esquema base con validaciones comunes
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50, description="Código único del producto")
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)

# Lo que el frontend envía al crear un producto (incluye el stock inicial)
class ProductCreate(ProductBase):
    initial_stock: int = Field(0, ge=0, description="Stock inicial en almacén")

# Lo que devolvemos cuando consultan el inventario
class InventoryResponse(BaseModel):
    quantity: int
    reserved_quantity: int
    available_stock: int

    model_config = ConfigDict(from_attributes=True)

# Lo que la API responde al frontend (Evita exponer datos internos innecesarios)
class ProductResponse(ProductBase):
    id: int
    inventory: Optional[InventoryResponse] = None

    # Configuración para que Pydantic pueda leer modelos de SQLAlchemy directamente
    model_config = ConfigDict(from_attributes=True)