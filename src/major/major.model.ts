// src/major/major.model.ts
// Data structure and MongoDB interactions

import { ProcessedRequirement } from '../requirement/requirement.model';
import { MajorModel } from './major.schema';

// stored in the database
export interface Major {
    _id: string;  // Custom string ID for the major
    name: string;
    description?: string;
    needsYear: boolean;
    needsCollege: boolean;
    colleges: Array<{
        id: string;
        name: string;
    }>;
    requiredCourseNumber?: Number,
    basicRequirements: Array<{
        year?: string;
        college?: string;
        requirements: string[];
    }>;
    concentrations?: Array<{
        concentration: string;
        requirements: string[];
    }>;
    endRequirements?: Array<{
        year?: string;
        college?: string;
        requirements: string[];
    }>;
    onboardingCourses: string[];
}

// provided to frontend
export interface ProcessedMajor {
    id: string;
    name: string;
    description?: string;
    needsYear: boolean;
    needsCollege: boolean;
    colleges: Array<{
        id: string;
        name: string;
    }>;
    selectedCollegeId: string;
    selectedYear: string;
    basicRequirements: ProcessedRequirement[];
    concentrationRequirements?: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }>;
    endRequirements?: ProcessedRequirement[];
}

/*
    Find a major by its _id
*/
export const findById = async (_id: string): Promise<Major | null> => {
    return await MajorModel.findOne({ _id });
};
