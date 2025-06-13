// src/major/major.controller.ts
// Request handlers for majors

import { Request, Response } from 'express';
import * as MajorService from './major.service';


export const getMajors = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { collegeId } = req.query;
        const majors = await MajorService.getMajors(collegeId as string | undefined);
        res.status(200).json(majors);
    } catch (error) {
        console.error('Error getting majors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMajorById = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { majorId } = req.params;
        const major = await MajorService.getMajorById(majorId);
        res.status(200).json(major);
    } catch (error) {
        console.error('Error getting major:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};