import os
import redis
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Inicializamos el pool de conexiones a Redis
redis_client = redis.from_url(
    REDIS_URL, 
    encoding="utf-8", 
    decode_responses=True  # Hace que Redis nos devuelva strings en lugar de bytes raw
)

def get_redis():
    """Helper para obtener el cliente de Redis"""
    return redis_client