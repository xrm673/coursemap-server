// src/requirement/requirement.controller.ts
// Request handlers for requirements

import { Request, Response } from 'express';
import * as RequirementService from './requirement.service';

export const getRequirementById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const requirement = await RequirementService.getRequirement(id);
    res.status(200).json(requirement);
};

