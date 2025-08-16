class DummyAgent:
    def perform_task(self, input_data):
        return {"translated": input_data}

def test_translate_task_execute():
    from src.tasks.translate_task import TranslateTask
    agent = DummyAgent()
    task = TranslateTask()
    result = task.execute(agent, "hello")
    assert result == {"translated": "hello"}

def test_analyze_review_task_execute():
    from src.tasks.analyze_review_task import AnalyzeReviewTask
    agent = DummyAgent()
    task = AnalyzeReviewTask()
    result = task.execute(agent, "review")
    assert result == {"translated": "review"}

def test_base_task_execute_raises():
    from src.tasks.base_task import BaseTask
    import pytest
    class DummyTask(BaseTask):
        def execute(self, agent, input_data):
            return super().execute(agent, input_data)
    task = DummyTask()
    with pytest.raises(NotImplementedError):
        task.execute(None, None)
