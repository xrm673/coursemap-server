// src/major/major.controller.ts
// Request handlers for majors

import { Request, Response } from 'express';
import * as MajorService from './major.service';

export const getMajorById = async (
    req: Request, res: Response
): Promise<void> => {
    const { majorId } = req.params;
    const major = await MajorService.getMajor(majorId);
    res.status(200).json(major);
};

export const getMajorWithRequirements = async (
    req: Request, res: Response
): Promise<void> => {
    const { majorId } = req.params;
    const { userId, selectedCollege, selectedYear } = req.query;
    
    const result = await MajorService.getMajorWithRequirements(
        majorId,
        userId as string | undefined,
        selectedCollege as string | undefined,
        selectedYear as string | undefined
    );
    
    res.status(200).json(result);
};