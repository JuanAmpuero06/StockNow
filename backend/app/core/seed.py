from sqlalchemy.orm import Session
from app.models.domain import User, Product, Inventory
from app.core.security import hash_password

def seed_database(db: Session):
    """
    Inyecta la semilla obligatoria de base de datos si no existe.
    """
    # 1. Semilla de Usuario Administrador Obligatorio
    admin_email = "test@stocknow.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            id=1,  # Intentar inyectar ID 1 explícitamente para cumplir la regla
            email=admin_email,
            hashed_password=hash_password("adminpassword"),  # Contraseña por defecto
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        try:
            db.commit()
            print("🚀 Semilla: Usuario Administrador Creado con Éxito (test@stocknow.com / adminpassword)")
        except Exception as e:
            db.rollback()
            # Si falla por restricción de ID primario, reintentar sin ID fijo
            admin_user.id = None
            db.add(admin_user)
            db.commit()
            print("🚀 Semilla: Usuario Administrador Creado con Éxito (ID autogenerado)")
    
    # 2. Semilla de Catálogo Inicial de Productos
    if db.query(Product).count() == 0:
        initial_products = [
            ("PROD-001", "Laptop Enterprise Core i7", 1299.99, 50),
            ("PROD-002", "Teclado Mecánico RGB", 89.50, 120),
            ("PROD-003", "Monitor UltraWide 34\"", 499.00, 30),
            ("PROD-004", "Mouse Ergonómico Inalámbrico", 45.00, 200)
        ]
        
        for sku, name, price, qty in initial_products:
            prod = Product(sku=sku, name=name, price=price, description=f"Descripción de muestra para {name}")
            db.add(prod)
            db.commit()
            db.refresh(prod)
            
            # Crear inventario asociado
            inv = Inventory(product_id=prod.id, quantity=qty, reserved_quantity=0)
            db.add(inv)
            db.commit()
            
        print("📦 Semilla: Catálogo inicial de productos y stock inyectado correctamente.")
