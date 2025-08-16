import logging
import os

class AgentConfig:
    def __init__(self):
        self.agent_type = os.getenv("AGENT_TYPE", "remote")  # 'remote' or 'local'
        self.remote_url = os.getenv("REMOTE_AGENT_URL", "https://example.com/agent")
        self.local_model_path = os.getenv("LOCAL_MODEL_PATH", "./models/ollama")

    def configure_agent(self):
        if self.agent_type == "remote":
            return self._configure_remote_agent()
        elif self.agent_type == "local":
            return self._configure_local_agent()
        else:
            raise ValueError("Invalid AGENT_TYPE. Must be 'remote' or 'local'.")

    def _configure_remote_agent(self):
        logging.info(f"Configuring remote agent at {self.remote_url}")
        # Add logic to initialize remote agent connection
        return {"type": "remote", "url": self.remote_url}

    def _configure_local_agent(self):
        logging.info(f"Configuring local agent with model path {self.local_model_path}")
        # Add logic to initialize local agent
        return {"type": "local", "path": self.local_model_path}

# Usage example
# agent_config = AgentConfig()
# agent = agent_config.configure_agent()