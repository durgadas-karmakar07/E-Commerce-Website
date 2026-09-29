import mongoose from 'mongoose';
import { config } from './env.js';

let mongodInstance: any = null;

export const connectDatabase = async (): Promise<string> => {
  try {
    // Attempt connecting to the configured MongoDB URI with a short timeout
    console.log(`[DB] Attempting connection to MongoDB at ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[DB] Connected successfully to external MongoDB.');
    return config.mongodbUri;
  } catch (err: any) {
    console.warn(`[DB] Could not connect to external MongoDB (${err.message}).`);

    if (config.nodeEnv !== 'production') {
      try {
        console.log('[DB] Launching embedded MongoDB memory server for development fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`[DB] Connected to embedded MongoDB at ${fallbackUri}`);
        return fallbackUri;
      } catch (fallbackError: any) {
        console.error('[DB] Failed to launch embedded MongoDB:', fallbackError);
        throw fallbackError;
      }
    } else {
      throw err;
    }
  }
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
