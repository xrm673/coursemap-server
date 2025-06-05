// src/course/course.routes.ts
// API routes for courses

import express from 'express';
import { getCourseById, getCoursesByIds } from './course.controller';

const courseRouter = express.Router();

// Course routes
courseRouter.get('/:id', getCourseById);
courseRouter.post('/batch', getCoursesByIds);

// Export the router
export { courseRouter };
