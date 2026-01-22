// src/new-program/new-program.routes.ts
// Routes for new program requirements

import { Router } from 'express';
import * as NewProgramController from './new-program.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const newProgramRouter = Router();

newProgramRouter.get('/:programId', authenticate, NewProgramController.getProgram);

export { newProgramRouter };
