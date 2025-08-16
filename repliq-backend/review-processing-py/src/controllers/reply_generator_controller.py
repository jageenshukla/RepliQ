from fastapi import APIRouter
from src.tasks.reply_generation_tasks import reply_generation_flow
from pydantic import BaseModel

class ReplyGenerationRequest(BaseModel):
    customer_review: str
    customer_name: str


class ReplyGeneratorController:
    def __init__(self, db_service=None):
        self.db_service = db_service
        self.router = APIRouter()
        self.router.post("/generate-reply")(self.generate_reply_endpoint)

    def generate_reply_endpoint(self, request: ReplyGenerationRequest):
        reply = reply_generation_flow(request.customer_review, request.customer_name, db_service=self.db_service)
        return {"generated_reply": reply}
