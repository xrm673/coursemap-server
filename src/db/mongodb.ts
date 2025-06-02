import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { userSchema } from '../user/user.schema';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'CourseMap';

let client: MongoClient;
let db: Db;

export const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;

  try {
    client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    
    // Initialize collections
    await db.createCollection(userSchema.name).catch(err => {
      if (err.code !== 48) { // 48 is the error code for collection already exists
        throw err;
      }
    });
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const getDatabase = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};