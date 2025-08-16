
import pytest
import importlib
import types

class DummyCollection:
    def __init__(self, data=None):
        self._data = data or []
        self.inserted = []
    def find_one(self, query):
        for item in self._data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None
    def insert_one(self, doc):
        self.inserted.append(doc)
        return types.SimpleNamespace(inserted_id="dummyid")
    def find(self, query):
        return self._data
    def delete_one(self, query):
        # Simulate deletion by removing matching items from _data
        self._data = [item for item in self._data if not all(item.get(k) == v for k, v in query.items())]
        return types.SimpleNamespace(deleted_count=1)

class DummyDB:
    def __init__(self, reviews=None, processed=None):
        self.reviews = DummyCollection(reviews)
        self.processed_review = DummyCollection(processed)
    def get_collection(self, name):
        # Always return a DummyCollection for any collection name
        return DummyCollection()

class DummyService:
    def get_collection(self, name):
        return DummyCollection()
    def __init__(self, reviews=None, processed=None):
        self.db = DummyDB(reviews, processed)
    def connect(self):
        self.db = DummyDB()

@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    dummy = DummyService()
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    monkeypatch.setattr("src.utils.db_service.DatabaseService.__new__", lambda cls, *a, **kw: dummy)
    yield

def test_translate_endpoint():
    from src.app import create_app
    from fastapi.testclient import TestClient
    app = create_app(db_service=DummyService())
    client = TestClient(app)
    response = client.post("/translate", json={"japanese_text": "こんにちは"})
    assert response.status_code == 200
    assert "translated_text" in response.json()

def test_generate_reply_endpoint():
    from src.app import create_app
    from fastapi.testclient import TestClient
    app = create_app(db_service=DummyService())
    client = TestClient(app)
    response = client.post("/generate-reply", json={"customer_review": "Great product!", "customer_name": "Alice"})
    assert response.status_code == 200
    assert "generated_reply" in response.json()

def test_analyze_review_endpoint():
    from src.app import create_app
    from fastapi.testclient import TestClient
    app = create_app(db_service=DummyService())
    client = TestClient(app)
    response = client.post("/analyze-review", json={"review_text": "This is a test review."})
    assert response.status_code == 200
    assert "analysis_result" in response.json()
