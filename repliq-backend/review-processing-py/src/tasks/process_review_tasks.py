import concurrent.futures
import threading
import logging
from functools import wraps
from typing import Any, Dict
import asyncio
from ..agents.ai_agents.ai_agent_translator import AIAgentTranslator
from ..agents.ai_agents.ai_agent_reply_generator import AIAgentReplyGenerator
from ..agents.ai_agents.ai_agent_review_analyzer import AIAgentReviewAnalyzer
from src.utils.db_service import DatabaseService
from bson import ObjectId


def save_to_database_task(review_id: str, translation: str, reply: str, analysis: dict, review_date: str, source: str, product_id: str, raw_review: dict):
    if is_review_already_processed(review_id):
        logging.info(f"[SKIP] Review with orgReviewId={review_id} already processed, skipping save.")
        return
    db = DatabaseService().db
    processed_review = {
        "orgReviewId": review_id,
        "isProcessed": True,
        "enReview": translation,
        "aiGeneratedReply": {
            "aiReply": reply,
            "isApproved": False
        },
        "analysis": analysis,
        "reviewDate": review_date,
        "source": source,
        "productId": product_id,
        "rawReview": raw_review
    }
    db.processed_review.insert_one(processed_review)


def fetch_review_details_task(source_review_id: str) -> dict:
    logging.info(f"Fetching review details for sourceReviewId: {source_review_id}")
    db = DatabaseService().db
    review = db.reviews.find_one({"sourceReviewId": source_review_id})
    if not review:
        logging.error(f"Review with sourceReviewId {source_review_id} not found in the database.")
        raise ValueError(f"Review with sourceReviewId {source_review_id} not found.")
    logging.debug(f"Fetched review details for sourceReviewId {source_review_id}: {review}")
    return review

# Helper for extracting review fields safely
def extract_review_fields(review_details: dict) -> Dict[str, Any]:
    try:
        attrs = review_details["rawReview"]["attributes"]
        review_text = f"{attrs.get('title', '')}\n{attrs.get('body', '')}"
        customer_name = attrs.get("reviewerNickname", "")
        review_date = attrs.get("createdDate", "")
        source = review_details.get("source", "")
        product_id = review_details.get("productId", "")
        return {
            "review_text": review_text,
            "customer_name": customer_name,
            "review_date": review_date,
            "source": source,
            "product_id": product_id,
            "raw_review": attrs
        }
    except Exception as e:
        logging.error(f"Error extracting review fields: {e}")
        raise

# Decorator for logging and error handling
def log_and_run_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        t = threading.current_thread()
        logging.info(f"[subtask] Thread name: {t.name}, Thread id: {t.ident}, Function: {func.__name__}")
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logging.error(f"Exception in {func.__name__}: {e}")
            return None
    return wrapper



class ReviewProcessor:
    def __init__(self, db_service=None):
        self.db_service = db_service or DatabaseService()
        self.translation_agent = AIAgentTranslator()
        self.reply_agent = AIAgentReplyGenerator()
        self.analysis_agent = AIAgentReviewAnalyzer()


    @log_and_run_decorator
    def translation_task(self, review_text):
        return asyncio.run(self.translation_agent.perform_task(review_text))

    @log_and_run_decorator
    def reply_task(self, review_text, customer_name):
        full_review_text = f"customer name: {customer_name}\nreview text: {review_text}"
        logging.info(f"Generating reply for review text: {full_review_text}")
        return asyncio.run(self.reply_agent.perform_task(full_review_text))

    @log_and_run_decorator
    def analysis_task(self, review_text):
        return asyncio.run(self.analysis_agent.perform_task(review_text))

    def process_review_flow(self, source_review_id: str):
        thread = threading.current_thread()
        logging.info(f"[process_review_flow] Thread name: {thread.name}, Thread id: {thread.ident}, SourceReviewId: {source_review_id}")

        # Check if already processed before starting
        if is_review_already_processed(source_review_id):
            return

        review_details = fetch_review_details_task(source_review_id)
        fields = extract_review_fields(review_details)
        review_text = fields["review_text"]
        customer_name = fields["customer_name"]
        review_date = fields["review_date"]
        source = fields["source"]
        product_id = fields["product_id"]
        raw_review = fields["raw_review"]

        # Run tasks in parallel using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor() as executor:
            t_future = executor.submit(self.translation_task, review_text)
            r_future = executor.submit(self.reply_task, review_text, customer_name)
            a_future = executor.submit(self.analysis_task, review_text)

            translation = t_future.result()
            reply = r_future.result()
            analysis = a_future.result()

        # If any task failed, log and skip saving
        if translation is None or reply is None or analysis is None:
            logging.error(f"One or more subtasks failed for sourceReviewId={source_review_id}. Skipping DB save.")
            return

        # Check again before saving
        if is_review_already_processed(source_review_id):
            return

        save_to_database_task(
            source_review_id, translation, reply, analysis,
            review_date, source, product_id, raw_review
        )

# For backward compatibility, keep the old function name
def process_review_flow(source_review_id: str):
    return ReviewProcessor().process_review_flow(source_review_id)

# Utility to check if a review is already processed
def is_review_already_processed(review_id: str) -> str:
    db = DatabaseService().db
    existing = db.processed_review.find_one({"orgReviewId": review_id, "isProcessed": True})
    if existing:
        logging.info(f"Review with orgReviewId={review_id} already processed. Existing _id: {existing.get('_id')}")
        return existing.get('_id')
    return None