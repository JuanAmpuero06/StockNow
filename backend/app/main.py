from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.products import router as product_router
from app.api.v1.orders import router as order_router

app = FastAPI(
    title="StockNow API",
    description="Sistema Enterprise de Gestión de Órdenes e Inventario",
    version="1.0.0"
)

# ─── CONFIGURACIÓN DE CORS (Buenas Prácticas Fullstack) ───
# Definimos los orígenes permitidos. En desarrollo, permitimos el puerto de Vite.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Permite cualquier header (como Authorization para JWT)
)

# ─── INCLUSIÓN DE ROUTERS ───
app.include_router(product_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")

@app.get("/healthcheck", tags=["Infrastructure"])
def health_check():
    """
    Endpoint para que Docker o sistemas de monitoreo verifiquen que la API está viva.
    """
    return {"status": "healthy", "service": "StockNow Backend"}