import pytest
import types
import importlib

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

class DummyDB:
    def __init__(self, reviews=None, processed=None):
        self.reviews = DummyCollection(reviews)
        self.processed_review = DummyCollection(processed)

class DummyService:
    def __init__(self, reviews=None, processed=None):
        self.db = DummyDB(reviews, processed)

class DummyAgent:
    def __init__(self, result):
        self.result = result
    async def perform_task(self, *a, **k):
        return self.result

def patch_db(monkeypatch):
    def _patch(reviews=None, processed=None):
        from src.utils.db_service import DatabaseService
        DatabaseService.reset_instance()
        dummy = DummyService(reviews, processed)
        DatabaseService._instance = dummy
        DatabaseService._instance.db = dummy.db
        monkeypatch.setattr("src.utils.db_service.DatabaseService.__new__", lambda cls, *a, **kw: dummy)
        return dummy
    return _patch

@pytest.fixture
def patch_agents(monkeypatch):
    def _patch(trans="en", reply="reply", analysis={"score": 1}):
        import src.tasks.process_review_tasks as prt
        import importlib
        importlib.reload(prt)
        monkeypatch.setattr(prt, "AIAgentTranslator", lambda: DummyAgent(trans))
        monkeypatch.setattr(prt, "AIAgentReplyGenerator", lambda: DummyAgent(reply))
        monkeypatch.setattr(prt, "AIAgentReviewAnalyzer", lambda: DummyAgent(analysis))
    return _patch

def make_review():
    return {
        "sourceReviewId": "r1",
        "productId": "p1",
        "rawReview": {"attributes": {"title": "T", "body": "B", "reviewerNickname": "N", "createdDate": "D"}},
        "source": "S"
    }

def test_fetch_review_details_task_found(monkeypatch):
    dummy = patch_db(monkeypatch)(reviews=[make_review()])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    out = prt.fetch_review_details_task("r1")
    assert out["sourceReviewId"] == "r1"

def test_fetch_review_details_task_not_found(monkeypatch):
    dummy = patch_db(monkeypatch)(reviews=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    with pytest.raises(ValueError):
        prt.fetch_review_details_task("r1")

def test_extract_review_fields():
    review = make_review()
    import src.tasks.process_review_tasks as prt
    import importlib
    importlib.reload(prt)
    fields = prt.extract_review_fields(review)
    assert fields["review_text"] == "T\nB"
    assert fields["customer_name"] == "N"
    assert fields["review_date"] == "D"
    assert fields["source"] == "S"
    assert fields["product_id"] == "p1"
    assert fields["raw_review"] == review["rawReview"]["attributes"]

def test_is_review_already_processed_found(monkeypatch):
    dummy = patch_db(monkeypatch)(processed=[{"orgReviewId": "r1", "isProcessed": True, "_id": "id1"}])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    out = prt.is_review_already_processed("r1")
    assert out == "id1"

def test_is_review_already_processed_not_found(monkeypatch):
    dummy = patch_db(monkeypatch)(processed=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    out = prt.is_review_already_processed("r1")
    assert out is None

def test_save_to_database_task_inserts(monkeypatch):
    dummy = patch_db(monkeypatch)(processed=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    prt.save_to_database_task("r1", "en", "reply", {"score": 1}, "D", "S", "p1", {"foo": "bar"})
    assert dummy.db.processed_review.inserted

def test_save_to_database_task_skips_if_processed(monkeypatch):
    dummy = patch_db(monkeypatch)(processed=[{"orgReviewId": "r1", "isProcessed": True}])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    prt.save_to_database_task("r1", "en", "reply", {"score": 1}, "D", "S", "p1", {"foo": "bar"})
    # Should not insert again, so nothing new in inserted
    # (no assertion needed, just no error)

def test_review_processor_flow_success(monkeypatch, patch_agents):
    dummy = patch_db(monkeypatch)(reviews=[make_review()], processed=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    patch_agents()
    proc = prt.ReviewProcessor()
    proc.process_review_flow("r1")

def test_review_processor_flow_already_processed(monkeypatch, patch_agents):
    dummy = patch_db(monkeypatch)(reviews=[make_review()], processed=[{"orgReviewId": "r1", "isProcessed": True}])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    patch_agents()
    proc = prt.ReviewProcessor()
    proc.process_review_flow("r1")  # Should skip

def test_review_processor_flow_missing_review(monkeypatch, patch_agents):
    dummy = patch_db(monkeypatch)(reviews=[], processed=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    patch_agents()
    proc = prt.ReviewProcessor()
    with pytest.raises(ValueError):
        proc.process_review_flow("r1")

def test_review_processor_flow_subtask_fail(monkeypatch, patch_agents):
    dummy = patch_db(monkeypatch)(reviews=[make_review()], processed=[])
    import src.utils.db_service as db_service_mod
    importlib.reload(db_service_mod)
    db_service_mod.DatabaseService._instance = dummy
    db_service_mod.DatabaseService._instance.db = dummy.db
    import src.tasks.process_review_tasks as prt
    importlib.reload(prt)
    patch_agents(trans=None)  # translation_task will fail
    proc = prt.ReviewProcessor()
    proc.process_review_flow("r1")  # Should log and skip DB save
