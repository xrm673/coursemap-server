// src/major/major.routes.ts
// Routes for majors

import { Router } from 'express';
import * as MajorController from './major.controller';

const majorRouter = Router();

majorRouter.get('/', MajorController.getAllMajors);
majorRouter.get('/:majorId', MajorController.getMajorById);

export { majorRouter };

