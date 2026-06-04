import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# 1. Recuperar la URL de la base de datos desde las variables de entorno de Docker
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin:supersecretpassword@db:5432/enterprise_orders"
)

# 2. Crear el Engine (El motor que gestiona el pool de conexiones físicas a Postgres)
engine = create_engine(
    DATABASE_URL,
    # Buenas prácticas para entornos robustos y concurrentes:
    pool_size=20,          # Mantiene hasta 20 conexiones abiertas listas para usarse
    max_overflow=10,       # Permite abrir hasta 10 conexiones extra en picos de tráfico
    pool_pre_ping=True,    # Verifica si la conexión sigue viva antes de usarla (evita errores de timeout)
)

# 3. Crear la fábrica de sesiones (SessionLocal)
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# 4. La Dependencia "get_db" (La magia del ciclo de vida)
def get_db() -> Generator[Session, None, None]:
    """
    Dependency provider para FastAPI. Abre una sesión de base de datos
    para cada request y asegura su cierre al finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db  # Entrega la sesión al endpoint que la solicitó
    finally:
        db.close()  # SE EJECUTA SIEMPRE. Garantiza que la conexión regrese al pool.