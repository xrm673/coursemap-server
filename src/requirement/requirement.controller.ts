// src/requirement/requirement.controller.ts
// Request handlers for requirements

import { Request, Response } from 'express';
import * as RequirementService from './requirement.service';

export const getRequirementById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const requirement = await RequirementService.getRequirement(id);
    res.status(200).json(requirement);
};

export const getRequirementsByIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requirementsIds } = req.body;
        if (!requirementsIds || !Array.isArray(requirementsIds)) {
            res.status(400).json({ error: "Invalid input: 'ids' must be an array of strings." });
            return;
        }
        const requirements = await RequirementService.getRequirementsByIds(requirementsIds as string[]);
        res.status(200).json(requirements);
    } catch (error) {
        console.error('Error fetching requirements by IDs:', error);
        res.status(500).json({ error: 'Internal server error while fetching requirements' });
    }
};

export const getAllRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
        const { majorId } = req.query;
        const requirements = await RequirementService.getAllRequirements(majorId as string);
        res.status(200).json(requirements);
    } catch (error) {
        console.error('Error fetching requirements:', error);
        res.status(500).json({ error: 'Internal server error while fetching requirements' });
    }
};
