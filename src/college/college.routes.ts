// src/college/college.routes.ts
// API routes for colleges

import express from 'express';
import { getColleges, getCollegeById } from './college.controller';

const collegeRouter = express.Router();

collegeRouter.get('/', getColleges);
collegeRouter.get('/:id', getCollegeById);

export { collegeRouter };
