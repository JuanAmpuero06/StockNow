from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.domain import Order, OrderItem, Inventory, Product, OrderStatus
from app.schemas.order import OrderCreate

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: int) -> Order:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def create_order(self, user_id: int, obj_in: OrderCreate) -> Order:
        """
        Crea una orden bloqueando las filas de inventario de forma segura
        para evitar sobreventa por peticiones concurrentes.
        """
        try:
            total_amount = 0
            
            # 1. Crear el encabezado de la orden en estado PENDING
            db_order = Order(
                user_id=user_id,
                status=OrderStatus.PENDING,
                total_amount=0
            )
            self.db.add(db_order)
            self.db.flush()  # Genera el ID de la orden sin confirmar la transacción todavía

            # 2. Procesar cada producto solicitado
            for item in obj_in.items:
                # 🛡️ CLAVE DE CONCURRENCIA: .with_for_update()
                # Envía un 'SELECT ... FOR UPDATE' a Postgres. Bloquea esta fila específica
                # del inventario. Si otra petición intenta leer este mismo inventario,
                # esperará pacientemente en cola hasta que esta transacción haga COMMIT o ROLLBACK.
                inventory = (
                    self.db.query(Inventory)
                    .filter(Inventory.product_id == item.product_id)
                    .with_for_update()
                    .first()
                )

                if not inventory:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"El producto con ID {item.product_id} no tiene un registro de inventario."
                    )

                # Verificar disponibilidad usando la propiedad (quantity - reserved_quantity)
                if inventory.available_stock < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stock insuficiente para el producto ID {item.product_id}. "
                               f"Disponible: {inventory.available_stock}, Solicitado: {item.quantity}"
                    )

                # Obtener el precio actual del producto
                product = self.db.query(Product).filter(Product.id == item.product_id).first()
                
                # Calcular subtotales
                item_price = product.price
                total_amount += item_price * item.quantity

                # 🔄 Actualizar el stock reservado
                inventory.reserved_quantity += item.quantity

                # Crear el detalle de la orden
                db_item = OrderItem(
                    order_id=db_order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item_price
                )
                self.db.add(db_item)

            # 3. Asignar el monto total final y consolidar la base de datos
            db_order.total_amount = total_amount
            self.db.commit()  # Aquí se guardan los cambios y se LIBERAN los bloqueos en Postgres
            
            self.db.refresh(db_order)
            return db_order

        except Exception as e:
            self.db.rollback()  # 🚨 Si ALGO falla, se revierte todo y se liberan los bloqueos de inmediato
            raise e