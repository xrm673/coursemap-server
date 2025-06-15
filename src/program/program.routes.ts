// src/major/major.routes.ts
// Routes for majors

import { Router } from 'express';
import * as ProgramController from './program.controller';

const programRouter = Router();

programRouter.get('/', ProgramController.getPrograms);
programRouter.get('/:programId', ProgramController.getProgramById);

export { programRouter };