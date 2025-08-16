import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from src.agents.ai_agents.ai_agent_reply_generator import AIAgentReplyGenerator

@pytest.mark.asyncio
async def test_perform_task_success():
    agent = AIAgentReplyGenerator()
    # Patch runner.run_async to yield a mock event with a valid response
    mock_event = MagicMock()
    mock_event.is_final_response.return_value = True
    mock_part = MagicMock()
    mock_part.text = '{"ai_reply": "Thanks!", "en_reply": "Thank you!"}'
    mock_event.content.parts = [mock_part]
    with patch("src.agents.ai_agents.ai_agent_reply_generator.AgentRunner") as MockRunner, \
         patch("src.agents.ai_agents.ai_agent_reply_generator.MongoSessionService") as MockSessionService:
        mock_runner = MockRunner.return_value
        mock_runner.run_async.return_value = AsyncMock()
        mock_runner.run_async.return_value.__aiter__.return_value = [mock_event]
        result = await agent.perform_task("Hello")
        assert result["ai_reply"] == "Thanks!"
        assert result["en_reply"] == "Thank you!"

@pytest.mark.asyncio
async def test_perform_task_invalid_json():
    agent = AIAgentReplyGenerator()
    mock_event = MagicMock()
    mock_event.is_final_response.return_value = True
    mock_part = MagicMock()
    mock_part.text = 'not a json'
    mock_event.content.parts = [mock_part]
    with patch("src.agents.ai_agents.ai_agent_reply_generator.AgentRunner") as MockRunner, \
         patch("src.agents.ai_agents.ai_agent_reply_generator.MongoSessionService") as MockSessionService:
        mock_runner = MockRunner.return_value
        mock_runner.run_async.return_value = AsyncMock()
        mock_runner.run_async.return_value.__aiter__.return_value = [mock_event]
        result = await agent.perform_task("Hello")
        assert "error" in result
