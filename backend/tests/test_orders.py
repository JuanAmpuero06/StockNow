from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from main import app
from app.core.database import get_db
from app.core.redis import get_redis
from app.repositories.order import OrderRepository
from app.api.v1.orders import get_order_repository

client = TestClient(app, raise_server_exceptions=False)

# Mock de la base de datos
def override_get_db():
    try:
        yield MagicMock()
    finally:
        pass

# Mock de Redis
mock_redis = MagicMock()
def override_get_redis():
    return mock_redis

# Mock de Repository
mock_repo = MagicMock()
def override_get_order_repository():
    return mock_repo

import pytest

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    app.dependency_overrides[get_order_repository] = override_get_order_repository
    yield
    app.dependency_overrides.clear()

def test_create_order_invalidates_cache():
    payload = {
        "items": [
            {"product_id": 1, "quantity": 2}
        ]
    }
    
    # Mocking the repository response
    from app.models.domain import OrderStatus
    from datetime import datetime
    mock_order = MagicMock()
    mock_order.id = 1
    mock_order.user_id = 1
    mock_order.status = OrderStatus.PENDING
    mock_order.total_amount = 10.0
    mock_order.created_at = datetime.now()
    mock_order.items = []
    mock_repo.create_order.return_value = mock_order
    
    # Mocking redis.keys to return some keys
    mock_redis.keys.return_value = ["products:all:1"]
    
    response = client.post("/api/v1/orders/", json=payload)
    
    assert response.status_code == 201
    mock_repo.create_order.assert_called_once()
    mock_redis.keys.assert_called_with("products:all:*")
    mock_redis.delete.assert_called_with("products:all:1")
