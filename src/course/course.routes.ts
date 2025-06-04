// src/course/course.routes.ts
// API routes for courses

import express from 'express';
import { getCourseById, getCoursesByIds, getCoursesWithInstructorsByIds } from './course.controller';

const courseRouter = express.Router();

// Course routes
courseRouter.get('/:id', getCourseById);
courseRouter.post('/batch', getCoursesByIds);
courseRouter.post('/batch/instructors', getCoursesWithInstructorsByIds);

// Export the router
export { courseRouter };
