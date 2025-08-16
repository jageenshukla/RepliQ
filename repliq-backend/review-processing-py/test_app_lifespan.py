from fastapi.testclient import TestClient
from src.app import app

def test_app_lifespan():
    client = TestClient(app)
    # Try a simple request to trigger startup/shutdown
    response = client.get("/docs")
    assert response.status_code == 200
