// src/course/course.routes.ts
// API routes for courses

import express from 'express';
import { getCourseById, getCoursesByIds, searchCourses } from './course.controller';

const courseRouter = express.Router();

// Course routes
courseRouter.get('/search', searchCourses);  // Search must come before /:id to avoid conflict
courseRouter.get('/:id', getCourseById);
courseRouter.post('/batch', getCoursesByIds);

// Export the router
export { courseRouter };
