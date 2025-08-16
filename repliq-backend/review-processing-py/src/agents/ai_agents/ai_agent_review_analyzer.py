from src.agents.base.base_agent import BaseAgent
from google.adk.sessions.session import Session
from src.utils.mongo_session_service import MongoSessionService
from google.adk.runners import Runner as AgentRunner
from google.genai import types
import uuid
import json
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
import os
from src.agents.prompts.ai_agent_review_analyzer.v1 import PROMPT

class AIAgentReviewAnalyzer(BaseAgent):
    def __init__(self, db_service=None):
        super().__init__(
            name="api_review_analyzer",
            model=os.getenv('MODEL_NAME', 'gpt-4.1'),
            description="Analyzes user reviews",
            instruction=PROMPT
        )
        self.db_service = db_service

    async def perform_task(self, input_data):
        try:
            session = Session(app_name="api_agent_app", user_id="user_123", id=str(uuid.uuid4()))
            session_service = MongoSessionService(db_service=self.db_service)
            session_service.create_session(session.id, session)
            runner = AgentRunner(agent=self.agent, session_service=session_service, app_name="api_agent_app")

            user_content = types.UserContent(input_data)
            response = ""
            async for event in runner.run_async(session_id=session.id, user_id=session.user_id, new_message=user_content):
                if event.is_final_response():
                    for part in event.content.parts:
                        if part.text:
                            response += part.text

            session_service.delete_session(session.id)
            session_service.close()

            try:
                parsed_response = json.loads(response)  # Convert string to JSON
                # Validate the structure
                if not all(key in parsed_response for key in ["sentiment", "issues", "new_requests"]):
                    raise ValueError("Response JSON does not contain the required keys.")
                return parsed_response
            except (json.JSONDecodeError, ValueError) as e:
                return {"error": f"Invalid response format: {str(e)}"}
        except Exception as e:
            return {"error": str(e)}
