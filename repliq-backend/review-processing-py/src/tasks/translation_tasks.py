import asyncio
from src.agents.ai_agents.ai_agent_translator import AIAgentTranslator

def translate_text_task(text: str, db_service=None) -> str:
    agent = AIAgentTranslator(db_service=db_service)
    return asyncio.run(agent.perform_task(text))

def translation_flow(japanese_text: str, db_service=None):
    return translate_text_task(japanese_text, db_service=db_service)

