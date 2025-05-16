// src/college/college.service.ts
// Business logic for colleges

import * as CollegeModel from './college.model';
import { College } from './college.model';

/*
    Get all colleges
*/
export const getAllColleges = async (): Promise<College[]> => {
    const colleges = await CollegeModel.find();
    return colleges;
};

/*
    Get a college by its code
*/
export const getCollegeByCode = async (code: string): Promise<College> => {
    const college = await CollegeModel.findByCode(code);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};
