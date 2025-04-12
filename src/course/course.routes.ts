// src/course/course.routes.ts
// API routes for courses

import express from 'express';
import { getCourseById } from './course.controller';

const router = express.Router();

// Course routes
router.get('/:id', getCourseById);

// Export the router
export const courseRouter = router;
