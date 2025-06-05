// src/college/college.routes.ts
// API routes for colleges

import express from 'express';
import { getColleges, getCollegeById } from './college.controller';

const collegeRouter = express.Router();

// GET /api/colleges - Get all colleges
collegeRouter.get('/', getColleges);

// GET /api/colleges/searchMajor - Search colleges by major name
// collegeRouter.get('/searchMajor', searchCollegesByMajor);

// GET /api/colleges/:id - Get a college by its id
collegeRouter.get('/:id', getCollegeById);

export { collegeRouter };
