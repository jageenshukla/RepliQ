import { Router } from 'express';
import { ingestReviewsByProductId } from '../controllers/reviewIngestionController';

const router = Router();

// curl -X POST http://localhost:3001/api/reviews/ingest/RMusic -H 'Content-Type: application/json' -d '{}'
// Route to ingest reviews by product ID
router.post('/ingest/:productId', ingestReviewsByProductId);

export default router;
