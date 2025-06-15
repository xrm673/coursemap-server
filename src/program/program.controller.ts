// src/major/major.controller.ts
// Request handlers for majors

import { Request, Response } from 'express';
import * as ProgramService from './program.service';


export const getPrograms = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { collegeId } = req.query;
        const programs = await ProgramService.getPrograms(collegeId as string | undefined);
        res.status(200).json(programs);
    } catch (error) {
        console.error('Error getting majors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProgramById = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { majorId } = req.params;
        const major = await ProgramService.getProgramById(majorId);
        res.status(200).json(major);
    } catch (error) {
        console.error('Error getting major:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};