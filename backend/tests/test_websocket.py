from fastapi.testclient import TestClient
from main import app
from app.core.websocket import manager
from app.core.security import create_access_token
import pytest
from starlette.websockets import WebSocketDisconnect

client = TestClient(app)

def test_websocket_lifecycle():
    # Generate a valid access token for testing
    token = create_access_token(subject="test@example.com")
    
    # 1. Connect WebSocket client with the valid token
    with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
        # Check connection registration
        assert len(manager.active_connections) >= 1
        
        # 2. Broadcast a test payload through manager
        import asyncio
        payload = {"type": "TEST_EVENT", "data": "hello_world"}
        
        async def do_broadcast():
            await manager.broadcast(payload)
            
        asyncio.run(do_broadcast())
        
        # 3. Read and assert message from WebSocket client
        received = websocket.receive_json()
        assert received["type"] == "TEST_EVENT"
        assert received["data"] == "hello_world"

    # 4. Connection should be cleaned up on close
    assert len(manager.active_connections) == 0

def test_websocket_unauthorized():
    # Try connecting without a token and assert it gets disconnected when trying to receive data
    with client.websocket_connect("/api/v1/ws") as websocket:
        with pytest.raises(WebSocketDisconnect) as exc_info:
            websocket.receive_text()
        assert exc_info.value.code == 1008  # WS_1008_POLICY_VIOLATION

def test_websocket_invalid_token():
    # Try connecting with an invalid token and assert it gets disconnected when trying to receive data
    with client.websocket_connect("/api/v1/ws?token=invalidtoken") as websocket:
        with pytest.raises(WebSocketDisconnect) as exc_info:
            websocket.receive_text()
        assert exc_info.value.code == 1008  # WS_1008_POLICY_VIOLATION

