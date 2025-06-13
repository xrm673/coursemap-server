// src/major/major.service.ts
// Business logic for majors

import * as MajorModel from './major.model';
import { Major } from './major.model';

/*
    Get all majors, optionally filtered by collegeId
*/
export const getMajors = async (collegeId?: string): Promise<Major[]> => {
    return await MajorModel.find(collegeId);
};

/*
    Get a major by its id
*/
export const getMajorById = async (majorId: string): Promise<Major> => {
    const major = await MajorModel.findById(majorId);
    if (!major) {
        throw new Error('Major not found');
    }
    return major;
};

