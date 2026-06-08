import pytest
from datetime import timedelta
from jose import jwt
try:
    import app
    print(f"DEBUG: app file is {app.__file__}")
except ImportError as e:
    print(f"DEBUG: Failed to import app: {e}")

from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

def test_password_hashing():
    password = "secretpassword"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_token_creation_and_verification():
    user_id = "123"
    token = create_access_token(subject=user_id)
    assert isinstance(token, str)
    
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["sub"] == user_id
    assert "exp" in payload

def test_jwt_token_expiration():
    user_id = "123"
    expires = timedelta(seconds=-1)
    token = create_access_token(subject=user_id, expires_delta=expires)
    
    with pytest.raises(Exception): # jose.exceptions.ExpiredSignatureError
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
