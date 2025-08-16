from .base_task import BaseTask

class TranslateTask(BaseTask):
    def execute(self, agent, input_data):
        # Logic for translation task
        return agent.perform_task(input_data)
