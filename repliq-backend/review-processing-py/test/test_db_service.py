import pytest
import logging
import types
import sys
from unittest.mock import patch, MagicMock

@pytest.fixture
def patch_env(monkeypatch):
    monkeypatch.setenv("DB_USER", "user")
    monkeypatch.setenv("DB_PASS", "pass")
    monkeypatch.setenv("DB_PORT", "27017")
    monkeypatch.setenv("DB_NAME", "testdb")

# Patch MongoClient to avoid real DB connection
class DummyMongoClient:
    def __init__(self, *a, **k):
        self.closed = False
        self.db = {}
    def __getitem__(self, name):
        return self.db.setdefault(name, {})
    def close(self):
        self.closed = True

@pytest.fixture
def patch_mongo(monkeypatch):
    monkeypatch.setattr("pymongo.MongoClient", DummyMongoClient)

@pytest.fixture
def db_service(patch_env, patch_mongo):
    from src.utils.db_service import DatabaseService
    DatabaseService.reset_instance()
    return DatabaseService()

def test_connect_and_close(db_service):
    db_service.connect()
    assert db_service.client is not None
    db_service.close()
    assert db_service.client is None

def test_get_collection(db_service):
    from unittest.mock import MagicMock
    db_service.db = MagicMock()
    col = db_service.get_collection("foo")
    db_service.db.__getitem__.assert_called_with("foo")

def test_get_collection_not_connected():
    from src.utils.db_service import DatabaseService
    DatabaseService.reset_instance()
    svc = DatabaseService()
    svc.db = None
    with pytest.raises(Exception):
        svc.get_collection("foo")

def test_connect_logs_error(monkeypatch, caplog):
    def fail_connect(*a, **k):
        raise Exception("fail")
    import sys
    monkeypatch.setattr("pymongo.MongoClient", fail_connect)
    sys.modules.pop("src.utils.db_service", None)
    from src.utils.db_service import DatabaseService
    DatabaseService.reset_instance()
    svc = DatabaseService()
    svc.client = None
    with caplog.at_level(logging.ERROR):
        svc.connect()
    assert any("Error connecting to the database" in m for m in caplog.messages)
