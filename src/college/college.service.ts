// src/college/college.service.ts
// Business logic for colleges

import { College } from './college.model';
import * as CollegeModel from './college.model';

/*
    Get all colleges
*/
export const getColleges = async (): Promise<College[]> => {
    return CollegeModel.find();
};

/*
    Get a college by its id
*/
export const getCollegeById = async (id: string): Promise<College> => {
    const college = await CollegeModel.findById(id);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};

/*
    Search colleges by major name
*/
export const searchCollegesByMajor = async (query: string): Promise<College[]> => {
    if (!query) {
        throw new Error('Search query is required');
    }
    return CollegeModel.searchByMajor(query);
};
