from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List
from src.controllers.process_review_controller import ProcessReviewController

# Define request model
class ProcessReviewRequest(BaseModel):
    productId: str
    sourceReviewIds: List[str]

# Initialize router and controller
router = APIRouter()
controller = ProcessReviewController()

@router.post("/process-review")
async def process_review(request: ProcessReviewRequest, background_tasks: BackgroundTasks):
    return controller.validate_and_process_reviews(request.productId, request.sourceReviewIds, background_tasks)
