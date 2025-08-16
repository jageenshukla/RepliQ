from abc import ABC, abstractmethod

class BaseTask(ABC):
    @abstractmethod
    def execute(self, agent, input_data):
        """Execute the task using the given agent."""
        raise NotImplementedError("Subclasses must implement execute()")
