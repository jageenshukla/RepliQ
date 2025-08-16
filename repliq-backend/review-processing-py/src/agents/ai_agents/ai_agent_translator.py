import logging
from src.agents.base.base_agent import BaseAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.agents import Agent
from google.adk.sessions.session import Session
from google.adk.runners import Runner as AgentRunner
from google.genai import types
import re
from src.utils.mongo_session_service import MongoSessionService
import uuid
import os
from src.agents.prompts.ai_agent_translator.v1 import PROMPT

class AIAgentTranslator(BaseAgent):
    def __init__(self, db_service=None):
        super().__init__(
            name="ai_agent_translator",
            model=os.getenv('MODEL_NAME', 'gpt-4.1'),
            description="Agent to translate Japanese text to English.",
            instruction=PROMPT
        )
        self.db_service = db_service

    async def perform_task(self, input_data: str) -> str:
        logging.info("Starting translation process...")
        session = Session(app_name="translation_app", user_id="user_123", id=str(uuid.uuid4()))

        session_service = MongoSessionService(db_service=self.db_service)
        session_service.create_session(session.id, session)
        runner = AgentRunner(agent=self.agent, session_service=session_service, app_name="translation_app")

        user_content = types.UserContent(input_data)
        try:
            async for event in runner.run_async(session_id=session.id, user_id=session.user_id, new_message=user_content):
                if event.is_final_response():
                    for part in event.content.parts:
                        if part.text:
                            logging.debug(f"Agent raw response: {part.text}")
                            clean_text = re.sub(r"<think>.*?</think>", "", part.text, flags=re.DOTALL).strip()
                            logging.debug(f"Agent cleaned response: {clean_text}")
                            return clean_text
        except Exception as e:
            logging.error(f"Error during translation: {e}")
        finally:
            session_service.delete_session(session.id)
            session_service.close()
        return "Translation failed or no response."
