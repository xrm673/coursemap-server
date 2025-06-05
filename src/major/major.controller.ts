// src/major/major.controller.ts
// Request handlers for majors

import { Request, Response } from 'express';
import * as MajorService from './major.service';


export const getAllMajors = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { collegeId } = req.query;
        const majors = await MajorService.getAllMajors(collegeId as string | undefined);
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
        // If user is authenticated, pass the uid, otherwise pass undefined
        const result = await MajorService.getMajorWithRequirements(majorId, req.user?._id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting major requirements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};