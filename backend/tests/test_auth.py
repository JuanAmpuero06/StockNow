from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from main import app
from app.core.database import get_db
from app.repositories.user import UserRepository
from app.api.v1.auth import get_user_repository
from app.api.v1.deps import get_current_user
from app.models.domain import User

client = TestClient(app, raise_server_exceptions=False)

# Mock DB session
mock_db = MagicMock()
def override_get_db():
    yield mock_db

# Mock UserRepository
mock_user_repo = MagicMock()
def override_get_user_repository():
    return mock_user_repo

# Mock Authenticated User
mock_user = User(id=1, email="test@example.com", role="operator", is_active=True)
def override_get_current_user():
    return mock_user

import pytest

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_user_repository] = override_get_user_repository
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()

def test_register_user():
    payload = {
        "email": "newuser@example.com",
        "password": "strongpassword",
        "role": "user"
    }
    
    mock_user_repo.get_by_email.return_value = None
    mock_created_user = User(id=2, email="newuser@example.com", role="user", is_active=True)
    mock_user_repo.create_user.return_value = mock_created_user
    
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json()["email"] == "newuser@example.com"
    assert response.json()["role"] == "user"
    mock_user_repo.create_user.assert_called_once()

def test_register_user_already_exists():
    payload = {
        "email": "existing@example.com",
        "password": "strongpassword",
        "role": "user"
    }
    
    mock_user_repo.get_by_email.return_value = User(id=3, email="existing@example.com", role="user", is_active=True)
    
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "El correo electrónico ya está registrado."

def test_get_me():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert response.json()["role"] == "operator"
