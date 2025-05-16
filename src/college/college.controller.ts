// src/college/college.controller.ts
// Request handlers for colleges

import { Request, Response } from 'express';
import * as CollegeService from './college.service';

/*
    Get all colleges
*/
export const getAllColleges = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const colleges = await CollegeService.getAllColleges();
        res.status(200).json(colleges);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve colleges' });
    }
};

/*
    Get a college by its code
*/
export const getCollegeByCode = async (
    req: Request, res: Response
): Promise<void> => {
    try {
        const { code } = req.params;
        const college = await CollegeService.getCollegeByCode(code);
        res.status(200).json(college);
    } catch (error) {
        if (error instanceof Error && error.message === 'College not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to retrieve college' });
        }
    }
};
