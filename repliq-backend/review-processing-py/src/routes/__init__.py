from fastapi import FastAPI
from src.controllers.translation_controller import TranslationController
from src.controllers.review_analysis_controller import ReviewAnalysisController
from src.routes.db_test import router as db_test_router
from src.routes.health import router as health_router
from src.controllers.reply_generator_controller import ReplyGeneratorController
from src.routes.process_review_routes import router as process_review_router

def register_routes(app: FastAPI):
    db_service = getattr(app.state, "db_service", None)

    # Include translation routes
    translation_controller = TranslationController(db_service=db_service)
    app.include_router(translation_controller.router)

    # Include review analysis routes
    review_analysis_controller = ReviewAnalysisController(db_service=db_service)
    app.include_router(review_analysis_controller.router)

    # Include db_test routes
    app.include_router(db_test_router)

    # Include reply generator routes
    reply_generator_controller = ReplyGeneratorController(db_service=db_service)
    app.include_router(reply_generator_controller.router)

    # Include process review routes
    app.include_router(process_review_router)

    # Include health check route
    app.include_router(health_router)