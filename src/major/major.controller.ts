// src/major/major.controller.ts
// Request handlers for majors

import { Request, Response } from 'express';
import * as MajorService from './major.service';

export const getMajorById = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { majorId } = req.params;
        const major = await MajorService.getMajor(majorId);
        res.status(200).json(major);
    } catch (error) {
        console.error('Error getting major:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMajorWithRequirements = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { majorId } = req.params;
        const { selectedCollegeId, selectedYear } = req.query;

        // User authentication is optional - use uid if user is authenticated
        const uid = req.user?.uid;
        
        const result = await MajorService.getMajorWithRequirements(
            majorId,
            uid,  // This will be undefined for unauthenticated users
            selectedCollegeId as string | undefined,
            selectedYear as string | undefined
        );
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting major requirements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};