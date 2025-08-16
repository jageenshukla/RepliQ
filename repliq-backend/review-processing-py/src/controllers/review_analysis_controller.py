from fastapi import APIRouter
from src.tasks.review_analysis_tasks import review_analysis_flow
from pydantic import BaseModel

class ReviewAnalysisRequest(BaseModel):
    review_text: str


class ReviewAnalysisController:
    def __init__(self, db_service=None):
        self.db_service = db_service
        self.router = APIRouter()
        self.router.post("/analyze-review")(self.analyze_review_endpoint)

    def analyze_review_endpoint(self, request: ReviewAnalysisRequest):
        analysis_result = review_analysis_flow(request.review_text, db_service=self.db_service)
        return {"analysis_result": analysis_result}
