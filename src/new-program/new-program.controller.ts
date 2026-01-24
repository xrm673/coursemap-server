// src/new-program/new-program.controller.ts
// Request handlers for new program requirements

import { Request, Response } from 'express';
import * as ProgramService from './services/program.service';
import { DEFAULT_SEMESTER } from '../utils/constants';
import { SortStrategy } from './dto/option.dto';

export const getProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { programId } = req.params;
        if (!programId) {
            res.status(400).json({ error: 'programId is required' });
            return;
        }

        // Get selectedSemester from query params, default to DEFAULT_SEMESTER
        const selectedSemester = (req.query.semester as string) || DEFAULT_SEMESTER;

        // Get sortStrategy from query params, default to "PRIORITY"
        const sortStrategyParam = (req.query.sortStrategy as string)?.toUpperCase();
        const validStrategies: SortStrategy[] = ["PRIORITY", "NONE"];
        const sortStrategy: SortStrategy = validStrategies.includes(sortStrategyParam as SortStrategy)
            ? (sortStrategyParam as SortStrategy)
            : "PRIORITY";

        const programResponse = await ProgramService.getProgram(
            programId as string,
            requestingUser._id,
            selectedSemester,
            sortStrategy
        );

        res.status(200).json({
            message: 'Program fetched successfully',
            data: programResponse
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Program not found' || error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                console.error('Error getting program:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        } else {
            console.error('Error getting program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
