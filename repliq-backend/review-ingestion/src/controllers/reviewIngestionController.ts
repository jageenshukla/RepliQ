import { Request, Response } from 'express';
import { logObj } from '../utils/logger';
import { getDb } from '../utils/db';
import { AppleApiService } from '../services/appleApiService';
import { NotificationService } from '../services/notificationService';
import ProcessReviewService from '../services/processReviewService';

export const ingestReviewsByProductId = async (req: Request, res: Response) => {
  const { productId } = req.params;
  let result: any = { ingested: 0, skipped: 0, errors: [] };
  let ingestedSourceReviewIds: string[] = [];

  try {
    const db = await getDb();
    const trimmedProductId = productId.trim();
    // Fetch product details
    const product = await db.collection('products').findOne({ productId: trimmedProductId });
    if (!product) {
      const allProductIds = await db.collection('products').find({}, { projection: { productId: 1, _id: 0 } }).toArray();
      return res.status(404).json({
        message: `Product with ID ${trimmedProductId} not found.`,
        availableProductIds: allProductIds.map(p => p.productId)
      });
    }

    const connectorIds = product.connectorIds || [];
    const connectors = await db.collection('connectors').find({ _id: { $in: connectorIds } }).toArray();

    const connectorsByType = connectors.reduce((acc: Record<string, any>, connector) => {
      acc[connector.type] = connector;
      return acc;
    }, {});

    // Process each connector type
    await Promise.all(
      Object.entries(connectorsByType).map(async ([type, connector]) => {
        if (type === 'apple') {
          try {
            const appleService = await AppleApiService.createForConnectorId(connector._id.toString());
            const appId = connector.config.appId;
            if (!appId) throw new Error('No appId found in connector config');

            let hasMore = true;
            let nextPageUrl: string | null = null;
            let reviewAlreadyExists = false;

            while (hasMore && !reviewAlreadyExists) {
              const reviewsResponse = await appleService.fetchCustomerReviews(appId, { limit: 100, sort: '-createdDate' }, nextPageUrl);
              const reviews = reviewsResponse.data;

              for (const review of reviews) {
                try {
                  const existingReview = await db.collection('reviews').findOne({ sourceReviewId: review.id, source: 'apple' });
                  if (existingReview) {
                    reviewAlreadyExists = true;
                    break;
                  }

                  const insertedReview = await db.collection('reviews').insertOne({
                    rawReview: review,
                    sourceReviewId: review.id,
                    productId,
                    source: 'apple',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                  ingestedSourceReviewIds.push(review.id);
                  result.ingested++;
                } catch (err) {
                  if ((err as any).code === 11000) {
                    // Duplicate key error, stop further processing
                    reviewAlreadyExists = true;
                    break;
                  } else {
                    result.errors.push({ reviewId: review.id, error: (err as any).message });
                  }
                }
              }

              hasMore = reviewsResponse.pagination.hasMore;
              nextPageUrl = reviewsResponse.pagination.nextPageUrl;
            }

          } catch (err: any) {
            result.errors.push({ connectorId: connector._id, error: err.message });
          }
        } else {
          // Placeholder for other connector types
          result.errors.push({ connectorId: connector._id, error: `Unsupported connector type: ${type}` });
        }
      })
    );
    
    result.ingestedSourceReviewIds = ingestedSourceReviewIds;

    res.json({ status: 'ok', result });

    if(ingestedSourceReviewIds.length > 0) {
      // Call process-review service after successful ingestion
      try {
        await ProcessReviewService.callProcessReviewService(trimmedProductId, ingestedSourceReviewIds);
      } catch (error) {
        logObj.error('Error in process-review service:', ['review-ingestion'], { error: (error as any).message });
      }
    }

    // Send notification after successful ingestion
    await sendIngestionNotification(trimmedProductId, result.ingested);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


const sendIngestionNotification = async (productId: string, ingestedCount: number) => {
  const notificationTitle = '✅ Review Ingestion Process Completed';

  const notificationMessage = ingestedCount > 0
    ? '🎉 The review ingestion process has successfully completed. Next, we will start the review analysis process for each of the ingested reviews.'
    : 'ℹ️ No new reviews were available for ingestion. The system is working as expected.';

  try {
    await NotificationService.sendNotification({
      title: notificationTitle,
      productName: productId,
      ingestedCount,
      message: notificationMessage
    });
  } catch (notificationError) {
    logObj.error('Notification failed:', ['review-ingestion'], { error: notificationError });
  }
};