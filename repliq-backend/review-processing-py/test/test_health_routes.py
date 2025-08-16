import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient



def test_health_routes_init_health():
    from src.routes.health_routes.__init__ import router as router1
    app = FastAPI()
    app.include_router(router1)
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


