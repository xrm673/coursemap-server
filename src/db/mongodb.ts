import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cu-explore';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
  } catch (error: any) {
    console.error('MongoDB connection error:', error?.message);
    process.exit(1);
  }
};

export const db = mongoose.connection;