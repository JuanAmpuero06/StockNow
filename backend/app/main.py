from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.products import router as product_router
from app.api.v1.orders import router as order_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from contextlib import asynccontextmanager
from app.core.database import SessionLocal
from app.core.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="StockNow API",
    description="Sistema Enterprise de Gestión de Órdenes e Inventario",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(dashboard_router, prefix="/api/v1")

from fastapi import WebSocket, WebSocketDisconnect, Query, status
from app.core.websocket import manager
from jose import jwt, JWTError
from app.core.config import settings

@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.accept()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token missing")
        return
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
    except JWTError:
        await websocket.accept()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/healthcheck", tags=["Infrastructure"])
def health_check():
    """
    Endpoint para verificación de salud del servicio.
    """
    return {"status": "healthy", "service": "StockNow Backend"}
