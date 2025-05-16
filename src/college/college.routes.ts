// src/college/college.routes.ts
// Routes for colleges

import { Router } from 'express';
import * as CollegeController from './college.controller';

const collegeRouter = Router();

// GET /api/colleges - Get all colleges
collegeRouter.get('/', CollegeController.getAllColleges);

// GET /api/colleges/:code - Get a college by its code
collegeRouter.get('/:code', CollegeController.getCollegeByCode);

export { collegeRouter };
