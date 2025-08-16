from .base_task import BaseTask

class AnalyzeReviewTask(BaseTask):
    def execute(self, agent, input_data):
        # Logic for review analysis task
        return agent.perform_task(input_data)
