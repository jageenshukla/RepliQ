import pytest
from fastapi import FastAPI
from src.app import create_app, lifespan

class DummyService:
    def __init__(self):
        self.connected = False
        self.closed = False
    def connect(self):
        self.connected = True
    def close(self):
        self.closed = True

def test_create_app_returns_fastapi_instance():
    app = create_app(db_service=DummyService())
    assert isinstance(app, FastAPI)

def test_create_app_registers_routes():
    app = create_app(db_service=DummyService())
    # Should have at least one registered route
    assert len(app.routes) > 0

def test_lifespan_context_manager_runs_startup_and_shutdown():
    app = FastAPI()
    dummy = DummyService()
    app.state.db_service = dummy
    async def run_lifespan():
        async with lifespan(app):
            assert dummy.connected is True
        assert dummy.closed is True
    import asyncio
    asyncio.run(run_lifespan())

def test_create_app_with_default_db_service(monkeypatch):
    # Patch DatabaseService to track instantiation
    from src.utils import db_service as db_service_mod
    db_service_mod.DatabaseService.reset_instance()
    monkeypatch.setattr(db_service_mod.DatabaseService, "connect", lambda self: setattr(self, "connected", True))
    monkeypatch.setattr(db_service_mod.DatabaseService, "close", lambda self: setattr(self, "closed", True))
    app = create_app()
    assert hasattr(app.state, "db_service")
    assert hasattr(app.state.db_service, "connect")
    assert hasattr(app.state.db_service, "close")
