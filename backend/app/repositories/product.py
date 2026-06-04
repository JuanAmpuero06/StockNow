from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.domain import Product, Inventory
from app.schemas.product import ProductCreate

class ProductRepository:
    def __init__(self, db: Session):
        """
        Recibe la sesión de la base de datos inyectada por FastAPI
        """
        self.db = db

    def get_by_id(self, product_id: int) -> Optional[Product]:
        """Busca un producto por su ID primario"""
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_by_sku(self, sku: str) -> Optional[Product]:
        """Busca un producto por su código SKU único"""
        return self.db.query(Product).filter(Product.sku == sku).first()

    def list(self, skip: int = 0, limit: int = 100) -> List[Product]:
        """Lista productos con paginación integrada para evitar sobrecargar la red"""
        return self.db.query(Product).offset(skip).limit(limit).all()

    def create(self, obj_in: ProductCreate) -> Product:
        """
        Crea un producto y su inventario inicial de forma atómica.
        Si la creación del inventario falla, el producto tampoco se guarda.
        """
        # 1. Instanciar el modelo de Producto
        db_product = Product(
            sku=obj_in.sku,
            name=obj_in.name,
            description=obj_in.description,
            price=obj_in.price
        )
        self.db.add(db_product)
        
        # 2. .flush() envía los cambios a la base de datos para generar el ID,
        # pero SIN consolidar la transacción (.commit) todavía.
        self.db.flush() 

        # 3. Crear el inventario asociado usando el ID recién generado
        db_inventory = Inventory(
            product_id=db_product.id,
            quantity=obj_in.initial_stock,
            reserved_quantity=0
        )
        self.db.add(db_inventory)
        
        # 4. Consolidar ambas operaciones en una sola transacción segura
        self.db.commit()
        
        # 5. Refrescar el estado del objeto para incluir la relación del inventario
        self.db.refresh(db_product)
        return db_product
