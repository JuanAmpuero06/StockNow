import os

class Settings:
    # ... tus otras configuraciones de BD y Redis ...
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "secret_de_respaldo_local")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = Settings()