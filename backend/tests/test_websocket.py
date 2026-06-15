from fastapi.testclient import TestClient
from main import app
from app.core.websocket import manager

client = TestClient(app)

def test_websocket_lifecycle():
    # 1. Connect WebSocket client
    with client.websocket_connect("/api/v1/ws") as websocket:
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
