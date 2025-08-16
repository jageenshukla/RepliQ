import logging
import pymongo
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class DatabaseService:
    @classmethod
    def reset_instance(cls):
        """Reset the singleton instance for test isolation."""
        if cls._instance and getattr(cls._instance, 'client', None):
            try:
                cls._instance.close()
            except Exception:
                pass
        cls._instance = None
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DatabaseService, cls).__new__(cls, *args, **kwargs)
            cls._instance.client = None
            cls._instance.db = None
            cls._instance.connect()  # Automatically connect during initialization
        return cls._instance

    def connect(self):
        if not self.client:
            try:
                mongo_uri = os.getenv('MONGODB_URI')
                logging.info(f"Attempting to connect to MongoDB at: {mongo_uri}")  # Log the MongoDB URI
                self.client = MongoClient(mongo_uri)
                self.db = self.client.get_default_database()
                logging.info("Database connection established.")
            except Exception as e:
                logging.error(f"Error connecting to the database: {e}")

    def get_collection(self, collection_name):
        if self.db is None:  # Explicitly check if the database is None
            raise Exception("Database not connected. Call connect() first.")
        return self.db[collection_name]

    def close(self):
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logging.info("Database connection closed.")