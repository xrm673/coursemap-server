// src/course/course.routes.ts
// API routes for courses

import express from 'express';
import { getCourseById } from './course.controller';

const courseRouter = express.Router();

// Course routes
courseRouter.get('/:id', getCourseById);

// Export the router
export { courseRouter };
