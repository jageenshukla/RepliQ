import asyncio
from src.agents.ai_agents.ai_agent_reply_generator import AIAgentReplyGenerator

def generate_reply_task(review: str, name: str, db_service=None) -> str:
    agent = AIAgentReplyGenerator(db_service=db_service)
    return asyncio.run(agent.perform_task(f"Review: {review}\nName: {name}"))

def reply_generation_flow(customer_review: str, customer_name: str, db_service=None):
    return generate_reply_task(customer_review, customer_name, db_service=db_service)
