// src/program/program.controller.ts
// Request handlers for programs

import { Request, Response } from 'express';
import * as ProgramService from './program.service';

export const getPrograms = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const programs = await ProgramService.getPrograms(req.query);
        res.status(200).json(programs);
    } catch (error) {
        console.error('Error getting programs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProgramById = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { programId } = req.params;
        const program = await ProgramService.getProgramById(programId);
        res.status(200).json(program);
    } catch (error) {
        console.error('Error getting program:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};