import asyncio
from src.agents.ai_agents.ai_agent_review_analyzer import AIAgentReviewAnalyzer

def analyze_review_task(text: str, db_service=None) -> dict:
    agent = AIAgentReviewAnalyzer(db_service=db_service)
    agent.create_agent()
    return asyncio.run(agent.perform_task(text))

def review_analysis_flow(review_text: str, db_service=None):
    return analyze_review_task(review_text, db_service=db_service)
