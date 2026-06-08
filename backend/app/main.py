from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.products import router as product_router
from app.api.v1.orders import router as order_router
from app.api.v1.auth import router as auth_router

app = FastAPI(
    title="StockNow API",
    description="Sistema Enterprise de Gestión de Órdenes e Inventario",
    version="1.0.0"
)

# ─── CONFIGURACIÓN DE CORS ───
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── REGISTRO DE RUTAS ───
app.include_router(auth_router, prefix="/api/v1")
app.include_router(product_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")

@app.get("/healthcheck", tags=["Infrastructure"])
def health_check():
    """
    Endpoint para verificación de salud del servicio.
    """
    return {"status": "healthy", "service": "StockNow Backend"}
