// src/requirement/requirement.routes.ts
// Routes for requirements

import { Router } from 'express';
import * as RequirementController from './requirement.controller';

const requirementRouter = Router();

requirementRouter.get('/', RequirementController.getAllRequirements);
requirementRouter.get('/:id', RequirementController.getRequirementById);
requirementRouter.post('/batch', RequirementController.getRequirementsByIds);

export { requirementRouter };

