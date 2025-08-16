import pytest
from fastapi.testclient import TestClient
import logging
import types
import sys

@pytest.fixture
def patch_db(monkeypatch):
    from src.utils.db_service import DatabaseService
    DatabaseService.reset_instance()
    class DummyService:
        def connect(self):
            self.connected = True
        def close(self):
            self.closed = True
    dummy = DummyService()
    DatabaseService._instance = dummy
    monkeypatch.setattr("src.utils.db_service.DatabaseService.__new__", lambda cls, *a, **kw: dummy)
    return dummy

def test_app_lifespan_startup_shutdown(patch_db, caplog):
    from src.app import app
    client = TestClient(app)
    with caplog.at_level(logging.INFO):
        with client:
            pass
    assert any("Starting up the application" in m for m in caplog.messages)
    assert any("Shutting down the application" in m for m in caplog.messages)

def test_app_routes_registered(patch_db):
    from src.app import app
    # Should have at least one registered route
    paths = [route.path for route in app.routes]
    assert len(paths) > 0

def test_app_import():
    import importlib
    m = importlib.import_module("src.app")
    assert hasattr(m, "app")
    assert hasattr(m, "lifespan")
