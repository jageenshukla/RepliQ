from fastapi import APIRouter
from src.tasks.translation_tasks import translation_flow
from pydantic import BaseModel

class TranslationRequest(BaseModel):
    japanese_text: str


class TranslationController:
    def __init__(self, db_service=None):
        self.db_service = db_service
        self.router = APIRouter()
        self.router.post("/translate")(self.translate_endpoint)

    def translate_endpoint(self, request: TranslationRequest):
        english_text = translation_flow(request.japanese_text, db_service=self.db_service)
        return {"translated_text": english_text}
