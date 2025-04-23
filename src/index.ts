import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { courseRouter } from './course/course.routes';
import { majorRouter } from './major/major.routes';
import { userRouter } from './user/user.routes';
import { requirementRouter } from './requirement/requirement.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/courses', courseRouter);
app.use('/api/majors', majorRouter); 
app.use('/api/requirements', requirementRouter);
app.use('/api/users', userRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Enter in browser: http://localhost:${port}`);
}); 