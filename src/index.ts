import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { courseRouter } from './course/course.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/courses', courseRouter);
// app.use('/api/majors', majorRouter);    // Uncomment when majors are implemented
// app.use('/api/subjects', subjectRouter); // Uncomment when subjects are implemented

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Enter in browser: http://localhost:${port}`);
}); 