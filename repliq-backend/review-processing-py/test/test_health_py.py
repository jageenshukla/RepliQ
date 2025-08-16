import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.routes import health

app = FastAPI()
app.include_router(health.router)
client = TestClient(app)

def test_health_route_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "review-processing-py"

def test_health_router_instance():
    assert hasattr(health, "router")
    assert hasattr(health.router, "routes")
    assert any(route.path == "/health" for route in health.router.routes)

def test_health_route_method():
    # Ensure the health function is callable and returns the expected dict
    result = health.health()
    assert isinstance(result, dict)
    assert result["status"] == "ok"
    assert result["service"] == "review-processing-py"
