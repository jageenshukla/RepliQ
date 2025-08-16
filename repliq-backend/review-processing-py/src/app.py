from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.routes import register_routes
from src.utils.db_service import DatabaseService

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(threadName)s %(thread)d %(message)s",
    force=True
)



def create_app(db_service=None):
    if db_service is None:
        db_service = DatabaseService()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup logic
        logging.info("Starting up the application")
        db_service.connect()
        yield
        # Shutdown logic
        logging.info("Shutting down the application")
        db_service.close()

    app = FastAPI(lifespan=lifespan)
    # Attach db_service to app for access in routes/controllers if needed
    app.state.db_service = db_service
    register_routes(app)
    return app

# Expose lifespan for test compatibility
@asynccontextmanager
async def lifespan(app: FastAPI):
    db_service = getattr(app.state, "db_service", None)
    logging.info("Starting up the application")
    if db_service:
        db_service.connect()
    yield
    logging.info("Shutting down the application")
    if db_service:
        db_service.close()

# Default app for production
app = create_app()
