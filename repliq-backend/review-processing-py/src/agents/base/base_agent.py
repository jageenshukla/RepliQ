from abc import ABC, abstractmethod
from google.adk.models.lite_llm import LiteLlm
from google.adk.agents import Agent

class BaseAgent(ABC):
    def __init__(self, name: str, model: str, description: str, instruction: str):
        self.name = name
        self.model = model
        self.description = description
        self.instruction = instruction
        self.agent = self.create_agent()  # Initialize the agent during instantiation

    def create_agent(self):
        """Create the agent instance."""
        return Agent(
            name=self.name,
            model=LiteLlm(model=self.model),
            description=self.description,
            instruction=self.instruction
        )

    @abstractmethod
    async def perform_task(self, input_data):
        """Perform the task using the agent."""
        pass
