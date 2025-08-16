import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/repliq?authSource=admin';
const dbName = 'repliq';

async function setupDatabase(force = false) {
  let client: MongoClient | null = null;
  let db;
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB.');
    console.error('Tips:');
    console.error('- Make sure Docker is running and you have started MongoDB with: docker compose up mongo');
    console.error('- Check your docker-compose.yml for the correct username, password, and port.');
    console.error('- Ensure your .env file has the correct MONGODB_URI.');
    console.error('- If running on Apple Silicon, ensure your MongoDB image supports your architecture.');
    process.exit(1);
  }

  const collections = ['reviews', 'products', 'connectors', 'notificationChannels'];

  if (force) {
    for (const name of collections) {
      if (await db.listCollections({ name }).hasNext()) {
        await db.collection(name).drop();
        console.log(`Dropped collection: ${name}`);
      }
    }
  }

  // Indexes
  await db.collection('reviews').createIndex({ source: 1, sourceReviewId: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ productId: 1 });
  await db.collection('products').createIndex({ productId: 1 }, { unique: true });
  await db.collection('notificationChannels').createIndex({ 'config.webhookUrl': 1 }, { unique: true, sparse: true });

  // Insert sample data if collections are empty (in both SAFE and FORCE modes)
  const productsCount = await db.collection('products').countDocuments();
  const connectorsCount = await db.collection('connectors').countDocuments();
  const notificationChannelsCount = await db.collection('notificationChannels').countDocuments();

  if (productsCount === 0 && connectorsCount === 0 && notificationChannelsCount === 0) {
    const connectorId = new ObjectId();
    const notificationChannelId = new ObjectId();
    await db.collection('connectors').insertOne({
      _id: connectorId,
      type: 'apple',
      authType: 'jwt',
      config: {
        p8FilePath: '/secrets/<YOUR_AUTH_KEY_FILENAME>.p8', // <-- Set your .p8 file path here
        keyId: '<YOUR_KEY_ID>', // <-- Set your Apple Key ID here
        issuerId: '<YOUR_ISSUER_ID>', // <-- Set your Apple Issuer ID here
        bundleId: '<YOUR_BUNDLE_ID>', // <-- Set your App Bundle ID here
        appId: '<YOUR_APP_ID>', // <-- Set your App ID here
        apiUrl: 'https://api.appstoreconnect.apple.com'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection('notificationChannels').insertOne({
      _id: notificationChannelId,
      type: 'slack',
      config: { webhookUrl: '<YOUR_SLACK_WEBHOOK_URL>', channelName: '<YOUR_SLACK_CHANNEL_NAME>' },
      status: 'active',
      supportedTypes:['notify', 'confirmation'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection('products').insertOne({
      productId: '<YOUR_PRODUCT_ID>',
      name: '<YOUR_PRODUCT_NAME>',
      description: '<YOUR_PRODUCT_DESCRIPTION>',
      connectorIds: [connectorId],
      notificationChannelIds: [notificationChannelId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Print number of records in each collection for verification
  for (const name of collections) {
    const count = await db.collection(name).countDocuments();
    console.log(`\n--- ${name}: ${count}`);
  }

  await client.close();
  console.log(force ? 'Database force setup complete.' : 'Database setup complete.');
}

const force = process.argv.includes('--force');
console.log(force ? '\u26A0\uFE0F Running in FORCE mode: All collections will be dropped and recreated.' : '\u2705 Running in SAFE mode: Collections will be created if missing, and sample data will be inserted if empty.');
setupDatabase(force).catch(console.error);
