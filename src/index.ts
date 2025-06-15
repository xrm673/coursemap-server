import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { courseRouter } from './course/course.routes';
import { majorRouter } from './major/major.routes';
import { userRouter } from './user/user.routes';
import { requirementRouter } from './requirement/requirement.routes';
import { collegeRouter } from './college/college.routes';
import { authRouter } from './auth/auth.routes';
import { programRouter } from './program/program.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/programs', programRouter);
app.use('/api/majors', majorRouter); 
app.use('/api/requirements', requirementRouter);
app.use('/api/users', userRouter);
app.use('/api/colleges', collegeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize MongoDB connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    console.log('Connected to MongoDB successfully');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 