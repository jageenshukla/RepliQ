import logging
from bson import ObjectId
from fastapi import HTTPException
from fastapi.background import BackgroundTasks
from src.utils.db_service import DatabaseService
from src.tasks.process_review_tasks import process_review_flow

class ProcessReviewController:
    def __init__(self):
        self.db = DatabaseService().db

    def validate_and_process_reviews(self, product_id: str, sourceReviewIds: list, background_tasks: BackgroundTasks):
        # Validate productId
        if self.db is None:
            raise RuntimeError("Database connection is not established. Ensure the application has started and the database is connected.")

        product = self.db.products.find_one({"productId": product_id})
        if not product:
            # Fetch all available productIds
            all_products = list(self.db.products.find({}, {"productId": 1, "_id": 0}))
            available_product_ids = [p["productId"] for p in all_products]

            # Get DB info for debugging
            db_info = {}
            try:
                db_url = getattr(self.db.client, 'address', None)
                db_name = self.db.name
                collections = self.db.list_collection_names()
                collections_info = {}
                for coll in collections:
                    collections_info[coll] = self.db[coll].count_documents({})
                db_info = {
                    "db_url": str(db_url),
                    "db_name": db_name,
                    "collections": collections_info
                }
            except Exception as e:
                db_info = {"error": str(e)}

            raise HTTPException(
                status_code=404,
                detail={
                    "message": f"Product with ID {product_id} not found.",
                    "availableProductIds": available_product_ids,
                    "db_info": db_info
                }
            )

        # Validate sourceReviewIds existence and productId match
        if not isinstance(sourceReviewIds, list) or not all(isinstance(sid, str) for sid in sourceReviewIds):
            raise HTTPException(status_code=400, detail="sourceReviewIds must be a list of strings.")

        # Debug log: Log the query for the specific sourceReviewId
        for source_review_id in sourceReviewIds:
            logging.debug(f"Querying review: db.reviews.find({{ sourceReviewId: '{source_review_id}', productId: '{product_id}' }})")

        # Debug log: Perform a simple find query for the sourceReviewId and log the result
        for source_review_id in sourceReviewIds:
            review = self.db.reviews.find_one({"sourceReviewId": source_review_id, "productId": product_id})
            logging.debug(f"Simple find result for sourceReviewId {source_review_id} and productId {product_id}: {review}")

        # Validate sourceReviewIds existence and productId match
        reviews = list(self.db.reviews.find({"sourceReviewId": {"$in": sourceReviewIds}, "productId": product_id}))
        if len(reviews) != len(sourceReviewIds):
            raise HTTPException(status_code=404, detail="Some reviews not found or do not belong to the given productId (checked by sourceReviewId)")

        # Trigger the review processing flow for each sourceReviewId asynchronously
        try:
            for source_review_id in sourceReviewIds:
                background_tasks.add_task(process_review_flow, source_review_id)
            return {"status": "Tasks submitted for processing", "product_id": product_id, "sourceReviewIds": sourceReviewIds}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to submit tasks for processing: {str(e)}")
