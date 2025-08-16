import { Request, Response } from 'express';
import { AppleApiService } from '../services/appleApiService';
import { createLoggerWithTags } from '../utils/logger';
import { getDb } from '../utils/db';
import { findConnectorByBundleId } from '../services/connectorService';
import { Parser } from 'json2csv'; // Ensure you have json2csv installed

const appleApiLogger = createLoggerWithTags(['apple-api-test', 'api']);

// GET /appleapitest/reviews - fetch customer reviews for the appId from connector config
export const getAppleCustomerReviews = async (req: Request, res: Response) => {
  let result: any = {};
  let error: any = null;
  try {
    // Find connector by bundleId (or however you identify the connector)
    const bundleId = 'jp.co.rakuten.music';
    const db = await getDb();
    const connector = await findConnectorByBundleId(bundleId, 'apple');
    if (!connector) throw new Error(`No Apple connector found for bundleId: ${bundleId}`);
    const connectorId = connector._id.toString();
    const appleService = await AppleApiService.createForConnectorId(connectorId);
    const appId = connector.config.appId;
    if (!appId) throw new Error('No appId found in connector config');
    // Convert req.query to a plain object with only string, number, or boolean values
    const queryParams: Record<string, string | number | boolean> = {};
    for (const key in req.query) {
      const value = req.query[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        queryParams[key] = value;
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        queryParams[key] = value[0]; // Take the first value if array
      }
    }
    // Always request latest reviews first unless user overrides
    if (!('sort' in queryParams)) {
      queryParams['sort'] = '-createdDate';
    }
    const reviewsResponse = await appleService.fetchCustomerReviews(appId, queryParams);
    result.reviews = Array.isArray(reviewsResponse?.data)
      ? reviewsResponse.data.map((review: any) => ({
          id: review.id,
          rating: review.attributes?.rating,
          value: review.attributes?.value,
          title: review.attributes?.title,
          body: review.attributes?.body,
          reviewerNickname: review.attributes?.reviewerNickname,
          territory: review.attributes?.territory,
          createdDate: review.attributes?.createdDate
        }))
      : [];

    result.pagination = reviewsResponse.pagination;
    // appleApiLogger.info('Fetched customer reviews', ['apple-api-test'], { reviews: result.reviews });
  } catch (err) {
    error = String(err);
    appleApiLogger.error('Apple customer reviews fetch failed', ['apple-api-test', 'error'], { error });
  }
  res.json({
    status: error ? 'error' : 'ok',
    result,
    error,
    timestamp: new Date().toISOString(),
    message: error ? 'Apple customer reviews fetch failed' : 'Apple customer reviews fetch succeeded',
  });
};

// GET /appleapitest/processed-reviews - fetch processed reviews for a given productId
export const getProcessedReviews = async (req: Request, res: Response) => {
  let result: any = [];
  let error: any = null;

  try {
    const { productId, start, end } = req.query;
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid or missing productId');
    }


    // Prepare date filter for string-based reviewDate (YYYY-MM-DD)
    let query: any = { productId };
    if ((typeof start === 'string' && start.trim() !== '') || (typeof end === 'string' && end.trim() !== '')) {
      // Build regex for date range
      // Extract only the date part from reviewDate (first 10 chars)
      // We'll use $expr and $substr to compare as strings
      const dateConditions: any[] = [];
      if (typeof start === 'string' && start.trim() !== '') {
        dateConditions.push({ $gte: [ { $substr: [ "$reviewDate", 0, 10 ] }, start ] });
      }
      if (typeof end === 'string' && end.trim() !== '') {
        dateConditions.push({ $lte: [ { $substr: [ "$reviewDate", 0, 10 ] }, end ] });
      }
      query.$expr = { $and: dateConditions };
    }

    const db = await getDb();
    const processedReviewsCollection = db.collection('processed_review');

    // Fetch all processed reviews for the given productId and date filter
    const reviewsCursor = processedReviewsCollection.find(query);
    const reviews = await reviewsCursor.toArray();

    // Format the response
    result = reviews.map((review: any) => ({
      enReview: review.enReview,
      aiGeneratedReply: review.aiGeneratedReply,
      analysis: review.analysis,
      reviewDate: review.reviewDate,
      source: review.source,
      productId: review.productId,
      rawReview: review.rawReview,
    }));
  } catch (err) {
    error = String(err);
    appleApiLogger.error('Failed to fetch processed reviews', ['apple-api-test', 'error'], { error });
  }

  res.json({
    status: error ? 'error' : 'ok',
    result,
    error,
    timestamp: new Date().toISOString(),
    message: error ? 'Failed to fetch processed reviews' : 'Processed reviews fetched successfully',
  });
};

// GET /appleapitest/processed-reviews-csv - export processed reviews as CSV
export const exportProcessedReviewsAsCsv = async (req: Request, res: Response) => {
  let reviews: any[] = [];
  let error: any = null;

  try {
    const { productId, start, end } = req.query;
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid or missing productId');
    }

    // Prepare date filter for string-based reviewDate (YYYY-MM-DD)
    let query: any = { productId };
    if ((typeof start === 'string' && start.trim() !== '') || (typeof end === 'string' && end.trim() !== '')) {
      const dateConditions: any[] = [];
      if (typeof start === 'string' && start.trim() !== '') {
        dateConditions.push({ $gte: [ { $substr: [ "$reviewDate", 0, 10 ] }, start ] });
      }
      if (typeof end === 'string' && end.trim() !== '') {
        dateConditions.push({ $lte: [ { $substr: [ "$reviewDate", 0, 10 ] }, end ] });
      }
      query.$expr = { $and: dateConditions };
    }

    const db = await getDb();
    const processedReviewsCollection = db.collection('processed_review');

    // Fetch all processed reviews for the given productId and date filter
    const reviewsCursor = processedReviewsCollection.find(query);
    reviews = await reviewsCursor.toArray();

    // Format reviews for CSV
    const formattedReviews = reviews.map((review: any) => {
      const issues = (review.analysis?.issues || []).map((issue: any) => `${issue.title}\n${issue.description}`).join('\n\n');
      const newRequests = (review.analysis?.new_requests || []).map((request: any) => `${request.title}\n${request.description}`).join('\n\n');

      return {
        productId: review.productId,
        source: review.source,
        reviewDate: review.reviewDate,
        'rawReview.rating': review.rawReview?.rating,
        'rawReview.review': `${review.rawReview?.title}\n${review.rawReview?.body}`,
        'rawReview.reviewerNickname': review.rawReview?.reviewerNickname,
        aiReply: review.aiGeneratedReply?.aiReply?.ai_reply,
        'aiReply.en_reply': review.aiGeneratedReply?.aiReply?.en_reply,
        'analysis.sentiment': review.analysis?.sentiment,
        'analysis.issues': issues,
        'analysis.new_requests': newRequests,
      };
    });

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(formattedReviews);

    // Set headers and send CSV
    res.header('Content-Type', 'text/csv');
    res.attachment(`processed_reviews_${productId}.csv`);
    res.send(csv);
  } catch (err) {
    error = String(err);
    appleApiLogger.error('Failed to export processed reviews as CSV', ['apple-api-test', 'error'], { error });
    res.status(500).json({
      status: 'error',
      error,
      message: 'Failed to export processed reviews as CSV',
    });
  }
};

export const appleApiTest = async (req: Request, res: Response) => {
  appleApiLogger.info('Apple API test endpoint accessed', ['apple-api-test', 'api']);
  let result: any = {};
  let error: any = null;

  try {
    // Find connector by bundleId
    const bundleId = 'jp.co.rakuten.music';
    const db = await getDb();
    const connector = await findConnectorByBundleId(bundleId, 'apple');
    if (!connector) throw new Error(`No Apple connector found for bundleId: ${bundleId}`);
    const connectorId = connector._id.toString();
    const appleService = await AppleApiService.createForConnectorId(connectorId);

    // Test fetchAllApps
    const appsResponse = await appleService.fetchAllApps({
      limit: 10,
      'fields[apps]': 'name,bundleId'
    }, true);
    const appsData = (appsResponse && Array.isArray((appsResponse as any).data)) ? (appsResponse as any).data : [];
    result.apps = appsData.map((app: any) => ({
      id: app.id,
      name: app.attributes?.name,
      bundleId: app.attributes?.bundleId
    }));
    appleApiLogger.info('Fetched app info', ['apple-api-test'], { apps: result.apps });

    // Add more API tests here as you implement more methods
    // e.g. result.appInfo = await appleService.fetchAppInfo('someAppId');
  } catch (err) {
    error = String(err);
    appleApiLogger.error('Apple API test failed', ['apple-api-test', 'error'], { error });
  }

  res.json({
    status: error ? 'error' : 'ok',
    result,
    error,
    timestamp: new Date().toISOString(),
    message: error ? 'Apple API test failed' : 'Apple API test succeeded',
  });
};
