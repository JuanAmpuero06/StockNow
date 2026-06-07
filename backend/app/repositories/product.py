from typing import List, Optional
from sqlalchemy.orm import Session, joinedload  # 1. Importar joinedload
from app.models.domain import Product, Inventory
from app.schemas.product import ProductCreate, ProductUpdate

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, product_id: int) -> Optional[Product]:
        """Busca un producto e hidrata su inventario inmediatamente con un JOIN"""
        return (
            self.db.query(Product)
            .options(joinedload(Product.inventory))  # ⚡ Eager Loading
            .filter(Product.id == product_id)
            .first()
        )

    def get_by_sku(self, sku: str) -> Optional[Product]:
        """Busca por SKU e hidrata el inventario"""
        return (
            self.db.query(Product)
            .options(joinedload(Product.inventory))  # ⚡ Eager Loading
            .filter(Product.sku == sku)
            .first()
        )

    def list(self, skip: int = 0, limit: int = 100) -> List[Product]:
        """Lista productos trayendo sus inventarios optimizados en una sola consulta SQL"""
        return (
            self.db.query(Product)
            .options(joinedload(Product.inventory))  # ⚡ Eager Loading
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, obj_in: ProductCreate) -> Product:
        db_product = Product(
            sku=obj_in.sku,
            name=obj_in.name,
            description=obj_in.description,
            price=obj_in.price
        )
        self.db.add(db_product)
        self.db.flush() 

        db_inventory = Inventory(
            product_id=db_product.id,
            quantity=obj_in.initial_stock,
            reserved_quantity=0
        )
        self.db.add(db_inventory)
        self.db.commit()
        
        # Usamos nuestro método interno que ya tiene el joinedload configurado
        return self.get_by_id(db_product.id)

    def update(self, product_id: int, obj_in: ProductUpdate) -> Optional[Product]:
        """Actualiza campos del producto y garantiza el retorno del inventario hidratado"""
        db_product = self.get_by_id(product_id)
        if not db_product:
            return None
            
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_product, field, value)
            
        self.db.commit()
        
        # ⚡ CRUCIAL: En lugar de .refresh() (que rompe las relaciones en sesiones concurrentes),
        # volvemos a solicitar el objeto fresco con su JOIN correspondiente.
        return self.get_by_id(product_id)

    def delete(self, product_id: int) -> bool:
        db_product = self.get_by_id(product_id)
        if not db_product:
            return False
            
        self.db.delete(db_product)
        self.db.commit()
        return True
