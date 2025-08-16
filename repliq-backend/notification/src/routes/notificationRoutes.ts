import { Router } from 'express';
import { NotificationService } from '../services/NotificationService';

const router = Router();

router.post('/notify', async (req, res) => {
  try {
    const { productId, type, message } = req.body;

    if (!productId || !type || !message) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields: productId, type, or message.' });
    }

    await NotificationService.sendNotification({ productId, type, message });
    res.json({ status: 'success', message: 'Notification sent successfully.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
