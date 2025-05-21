// src/college/college.controller.ts
// Request handlers for colleges

import { Request, Response } from 'express';
import * as CollegeService from './college.service';

/*
    Get all colleges
*/
export const getColleges = async (req: Request, res: Response): Promise<void> => {
    try {
        const colleges = await CollegeService.getColleges();
        res.status(200).json(colleges);
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*
    Get a college by its id
*/
export const getCollegeById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const college = await CollegeService.getCollegeById(id);
        res.status(200).json(college);
    } catch (error) {
        if (error instanceof Error && error.message === 'College not found') {
            res.status(404).json({ error: 'College not found' });
        } else {
            console.error('Error fetching college:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/*
    Search colleges by major name
*/
export const searchCollegesByMajor = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { query } = req.query;
        
        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }

        const colleges = await CollegeService.searchCollegesByMajor(query);
        res.status(200).json(colleges);
    } catch (error) {
        if (error instanceof Error && error.message === 'Search query is required') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Error searching colleges:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
