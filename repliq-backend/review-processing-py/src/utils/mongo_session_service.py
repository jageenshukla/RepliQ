import logging
from google.adk.sessions.base_session_service import BaseSessionService
from google.adk.sessions.session import Session
from pymongo.collection import Collection
from .db_service import DatabaseService
import asyncio

class MongoSessionService(BaseSessionService):
    def __init__(self, db_service=None):
        self.db_service = db_service or DatabaseService()
        self.db_service.connect()
        self.collection: Collection = self.db_service.get_collection("sessions")

    def create_session(self, session_id: str, session: Session):
        session_data = {
            "_id": session_id,
            "app_name": session.app_name,
            "user_id": session.user_id,
        }
        self.collection.insert_one(session_data)

    def delete_session(self, session_id: str):
        self.collection.delete_one({"_id": session_id})

    async def get_session(self, session_id: str, app_name: str = None, user_id: str = None) -> Session:
        await asyncio.sleep(0)  # Simulate async behavior
        session_data = self.collection.find_one({"_id": session_id})
        if session_data:
            return Session(
                id=session_data["_id"],
                app_name=session_data["app_name"],
                user_id=session_data["user_id"],
                state=session_data.get("state", {})
            )
        return None

    def list_sessions(self):
        sessions = self.collection.find()
        return [
            Session(
                id=session["_id"],
                app_name=session["app_name"],
                user_id=session["user_id"],
                state=session.get("state", {})
            )
            for session in sessions
        ]

    def close(self):
        logging.info("Closing MongoDB session service")
