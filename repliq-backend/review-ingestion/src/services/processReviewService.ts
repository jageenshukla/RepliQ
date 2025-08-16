
import axios from 'axios';

class ProcessReviewService {
  private static get PROCESS_REVIEW_URL() {
    const base = process.env.PROCESS_REVIEW_BASE_URL || 'http://localhost:3002';
    return `${base}/process-review`;
  }

  public static async callProcessReviewService(productId: string, sourceReviewIds: string[]) {
    try {
      await axios.post(this.PROCESS_REVIEW_URL, {
        productId,
        sourceReviewIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Process-review service called successfully
    } catch (error) {
      // Failed to call process-review service
      throw error;
    }
  }
}

export default ProcessReviewService;
