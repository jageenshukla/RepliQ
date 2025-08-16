import pytest
from fastapi import HTTPException, BackgroundTasks
from src.controllers.process_review_controller import ProcessReviewController


class DummyDB:
    def __init__(self, products=None, reviews=None):
        self.products = DummyCollection(products)
        self.reviews = DummyCollection(reviews)

class DummyCollection:
    def __init__(self, data=None):
        self._data = data or []
    def find_one(self, query):
        for item in self._data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None
    def find(self, query):
        # Only supports {"sourceReviewId": {"$in": [...]}, "productId": ...}
        source_ids = query.get("sourceReviewId", {}).get("$in", [])
        product_id = query.get("productId")
        return [item for item in self._data if item.get("sourceReviewId") in source_ids and item.get("productId") == product_id]


class DummyService:
    def __init__(self, products, reviews):
        self.db = DummyDB(products, reviews)

def patch_db(monkeypatch, products, reviews):
    from src.utils.db_service import DatabaseService
    DatabaseService.reset_instance()
    dummy_service = DummyService(products, reviews)
    DatabaseService._instance = dummy_service
    monkeypatch.setattr("src.utils.db_service.DatabaseService.__new__", lambda cls, *a, **kw: dummy_service)

@pytest.fixture
def controller(monkeypatch):
    # Patch the DatabaseService to use our dummy DB
    products = [{"productId": "p1"}]
    reviews = [
        {"sourceReviewId": "r1", "productId": "p1"},
        {"sourceReviewId": "r2", "productId": "p1"}
    ]
    patch_db(monkeypatch, products, reviews)
    c = ProcessReviewController()
    # Ensure controller.db is set to the dummy DB
    from src.utils.db_service import DatabaseService
    c.db = DatabaseService._instance.db
    return c

def test_valid_process_reviews(controller):
    tasks = BackgroundTasks()
    result = controller.validate_and_process_reviews("p1", ["r1", "r2"], tasks)
    assert result["status"] == "Tasks submitted for processing"
    assert result["product_id"] == "p1"
    assert result["sourceReviewIds"] == ["r1", "r2"]

def test_product_not_found(monkeypatch):
    patch_db(monkeypatch, [], [])
    c = ProcessReviewController()
    from src.utils.db_service import DatabaseService
    c.db = DatabaseService._instance.db
    tasks = BackgroundTasks()
    with pytest.raises(HTTPException) as exc:
        c.validate_and_process_reviews("p1", ["r1"], tasks)
    assert exc.value.status_code == 404
    assert "Product not found" in str(exc.value.detail)

def test_invalid_source_review_ids(controller):
    tasks = BackgroundTasks()
    with pytest.raises(HTTPException) as exc:
        controller.validate_and_process_reviews("p1", "notalist", tasks)
    assert exc.value.status_code == 400
    assert "sourceReviewIds must be a list of strings" in str(exc.value.detail)

def test_some_reviews_not_found(monkeypatch):
    products = [{"productId": "p1"}]
    reviews = [{"sourceReviewId": "r1", "productId": "p1"}]
    patch_db(monkeypatch, products, reviews)
    c = ProcessReviewController()
    from src.utils.db_service import DatabaseService
    c.db = DatabaseService._instance.db
    tasks = BackgroundTasks()
    with pytest.raises(HTTPException) as exc:
        c.validate_and_process_reviews("p1", ["r1", "r2"], tasks)
    assert exc.value.status_code == 404
    assert "Some reviews not found" in str(exc.value.detail)

def test_db_not_connected(monkeypatch):
    class DummyService:
        db = None
    monkeypatch.setattr("src.utils.db_service.DatabaseService.__new__", lambda cls, *a, **kw: DummyService())
    c = ProcessReviewController()
    tasks = BackgroundTasks()
    with pytest.raises(RuntimeError):
        c.validate_and_process_reviews("p1", ["r1"], tasks)
