from fastapi.testclient import TestClient
from main import app
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.domain import User
from unittest.mock import MagicMock
import pytest

client = TestClient(app, raise_server_exceptions=False)

mock_user = User(id=1, email="admin@example.com", role="admin", is_active=True)

def override_get_db():
    mock_db = MagicMock()
    # Mock database queries to simulate statistics
    # 1. Total products query
    mock_db.query.return_value.count.return_value = 5
    # 2. Mocking filter chaining
    mock_filter_query = MagicMock()
    mock_filter_query.count.return_value = 2
    mock_filter_query.scalar.return_value = 1500.50
    mock_db.query.return_value.filter.return_value = mock_filter_query
    
    yield mock_db

def override_get_current_user():
    return mock_user

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()

def test_get_dashboard_stats_admin():
    global mock_user
    mock_user = User(id=1, email="admin@example.com", role="admin", is_active=True)
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_products"] == 5
    assert data["low_stock_count"] == 2
    assert data["pending_orders"] == 2
    assert float(data["total_sales"]) == 1500.50

def test_get_dashboard_stats_user_forbidden():
    global mock_user
    mock_user = User(id=2, email="user@example.com", role="user", is_active=True)
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 403
