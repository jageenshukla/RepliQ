import { Router } from 'express';
import { appleApiTest, getAppleCustomerReviews, getProcessedReviews, exportProcessedReviewsAsCsv } from '../controllers/appleApiTestController';

const router = Router();

// GET /appleapitest
router.get('/appleapitest', appleApiTest);

// GET /appleapitest/reviews
router.get('/appleapitest/reviews', getAppleCustomerReviews);

// GET /appleapitest/processed-reviews
router.get('/appleapitest/processed-reviews', getProcessedReviews);

// GET /appleapitest/processed-reviews-csv
router.get('/appleapitest/processed-reviews-csv', exportProcessedReviewsAsCsv);

export default router;
