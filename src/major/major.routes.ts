// src/major/major.routes.ts
// Routes for majors

import { Router } from 'express';
import * as MajorController from './major.controller';
import { optionalAuthenticate } from '../utils/middleware/auth.middleware';

const majorRouter = Router();

majorRouter.get('/:majorId', MajorController.getMajorById);
majorRouter.get('/:majorId/requirements', optionalAuthenticate, MajorController.getMajorWithRequirements);

export { majorRouter };

