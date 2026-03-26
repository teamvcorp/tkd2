import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

if (!process.env.MONGO_DB_STORAGE_MONGODB_URI) {
  throw new Error('Please define MONGO_DB_STORAGE_MONGODB_URI in your .env file');
}

const options: MongoClientOptions = {
  appName: 'devrel.vercel.integration',
  maxIdleTimeMS: 5000,
};

// Reuse a single client across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

const client: MongoClient =
  global._mongoClient ?? new MongoClient(process.env.MONGO_DB_STORAGE_MONGODB_URI!, options);

if (process.env.NODE_ENV !== 'production') {
  global._mongoClient = client;
}

// Attach to Vercel's pool for proper cleanup on function suspension
attachDatabasePool(client);

export default client;
