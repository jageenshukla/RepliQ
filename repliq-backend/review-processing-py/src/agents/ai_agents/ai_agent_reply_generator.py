import logging
from src.agents.base.base_agent import BaseAgent
from src.utils.mongo_session_service import MongoSessionService
from google.adk.sessions.session import Session
from google.adk.runners import Runner as AgentRunner
from google.genai import types
import uuid
from src.agents.prompts.reply_generator.v1 import PROMPT
import json
import re
import os

class AIAgentReplyGenerator(BaseAgent):
    def __init__(self, db_service=None):
        super().__init__(
            name="reply_generator",
            model=os.getenv('MODEL_NAME', 'gpt-4.1'),
            description="Generates personalized acknowledgment replies",
            instruction=PROMPT
        )
        self.db_service = db_service

    async def perform_task(self, input_data: str) -> dict:
        logging.info("Starting reply generation process...")
        session = Session(app_name="reply_generator_app", user_id="user_123", id=str(uuid.uuid4()))

        session_service = MongoSessionService(db_service=self.db_service)
        session_service.create_session(session.id, session)
        runner = AgentRunner(agent=self.agent, session_service=session_service, app_name="reply_generator_app")

        user_content = types.UserContent(input_data)
        try:
            async for event in runner.run_async(session_id=session.id, user_id=session.user_id, new_message=user_content):
                if event.is_final_response():
                    for part in event.content.parts:
                        if part.text:
                            logging.debug(f"Agent raw response: {part.text}")
                            clean_text = re.sub(r"<think>.*?</think>", "", part.text, flags=re.DOTALL).strip()
                            try:
                                parsed_response = json.loads(clean_text)
                                if not all(key in parsed_response for key in ["ai_reply", "en_reply"]):
                                    raise ValueError("Response JSON does not contain the required keys.")
                                logging.info(f"Agent reply generated successfully for input.")
                                return parsed_response
                            except (json.JSONDecodeError, ValueError) as e:
                                logging.error(f"Invalid response format: {str(e)}")
                                return {"error": f"Invalid response format: {str(e)}"}
        except Exception as e:
            logging.error(f"Error during reply generation: {e}")
            return {"error": str(e)}
        finally:
            session_service.delete_session(session.id)
            session_service.close()
        logging.error("Reply generation failed or no response.")
        return {"error": "Reply generation failed or no response."}
