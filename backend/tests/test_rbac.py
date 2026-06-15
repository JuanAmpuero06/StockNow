from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from main import app
from app.core.database import get_db
from app.core.redis import get_redis
from app.api.v1.deps import get_current_user
from app.models.domain import User
import pytest

client = TestClient(app, raise_server_exceptions=False)

# Shared mock variables
mock_current_user = User(id=1, email="test@example.com", role="user", is_active=True)

def override_get_db():
    mock_db = MagicMock()
    yield mock_db

def override_get_redis():
    mock_redis = MagicMock()
    mock_redis.get.return_value = None
    mock_redis.keys.return_value = []
    return mock_redis

def override_get_current_user():
    return mock_current_user

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()

# ─── PRODUCT CREATION PERMISSIONS (ONLY ADMIN & MANAGER) ───

def test_create_product_by_user_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="user@example.com", role="user", is_active=True)
    payload = {
        "sku": "NEW-PROD-SKU-1",
        "name": "User Product Attempt",
        "price": 15.50,
        "quantity": 10
    }
    response = client.post("/api/v1/products/", json=payload)
    assert response.status_code == 403

def test_create_product_by_operator_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="operator@example.com", role="operator", is_active=True)
    payload = {
        "sku": "NEW-PROD-SKU-2",
        "name": "Operator Product Attempt",
        "price": 15.50,
        "quantity": 10
    }
    response = client.post("/api/v1/products/", json=payload)
    assert response.status_code == 403

def test_create_product_by_manager_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="manager@example.com", role="manager", is_active=True)
    payload = {
        "sku": "NEW-PROD-SKU-3",
        "name": "Manager Product",
        "price": 15.50,
        "quantity": 10
    }
    response = client.post("/api/v1/products/", json=payload)
    assert response.status_code != 403

def test_create_product_by_admin_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="admin@example.com", role="admin", is_active=True)
    payload = {
        "sku": "NEW-PROD-SKU-4",
        "name": "Admin Product",
        "price": 15.50,
        "quantity": 10
    }
    response = client.post("/api/v1/products/", json=payload)
    assert response.status_code != 403

# ─── PRODUCT UPDATE & DELETE PERMISSIONS ───

def test_update_product_by_user_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="user@example.com", role="user", is_active=True)
    payload = {"name": "Updated Name", "price": 19.99}
    response = client.put("/api/v1/products/1", json=payload)
    assert response.status_code == 403

def test_update_product_by_manager_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="manager@example.com", role="manager", is_active=True)
    payload = {"name": "Updated Name", "price": 19.99}
    response = client.put("/api/v1/products/1", json=payload)
    assert response.status_code != 403

def test_delete_product_by_manager_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="manager@example.com", role="manager", is_active=True)
    response = client.delete("/api/v1/products/1")
    assert response.status_code == 403

def test_delete_product_by_admin_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="admin@example.com", role="admin", is_active=True)
    response = client.delete("/api/v1/products/1")
    assert response.status_code != 403

# ─── ORDER CREATION PERMISSIONS (ONLY USER) ───

def test_create_order_by_user_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="user@example.com", role="user", is_active=True)
    payload = {
        "items": [
            {"product_id": 1, "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code != 403

def test_create_order_by_operator_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="operator@example.com", role="operator", is_active=True)
    payload = {
        "items": [
            {"product_id": 1, "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code == 403

def test_create_order_by_manager_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="manager@example.com", role="manager", is_active=True)
    payload = {
        "items": [
            {"product_id": 1, "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code == 403

def test_create_order_by_admin_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="admin@example.com", role="admin", is_active=True)
    payload = {
        "items": [
            {"product_id": 1, "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code == 403

# ─── ORDER LISTING PERMISSIONS (ADMIN, MANAGER, OPERATOR) ───

def test_list_orders_by_user_forbidden():
    global mock_current_user
    mock_current_user = User(id=1, email="user@example.com", role="user", is_active=True)
    response = client.get("/api/v1/orders/")
    assert response.status_code == 403

def test_list_orders_by_operator_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="operator@example.com", role="operator", is_active=True)
    response = client.get("/api/v1/orders/")
    assert response.status_code != 403

def test_list_orders_by_manager_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="manager@example.com", role="manager", is_active=True)
    response = client.get("/api/v1/orders/")
    assert response.status_code != 403

def test_list_orders_by_admin_allowed():
    global mock_current_user
    mock_current_user = User(id=1, email="admin@example.com", role="admin", is_active=True)
    response = client.get("/api/v1/orders/")
    assert response.status_code != 403
