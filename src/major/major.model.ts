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
    colleges: Array<CollegeInMajor>;
    numberOfRequiredCourses?: Number,
    rawBasicRequirements: Array<RawBasicRequirement>;
    concentrations?: Array<Concentration>;
    rawEndRequirements?: Array<RawEndRequirement>;
    onboardingCourses: string[];
}

// provided to frontend
export interface ProcessedMajor extends Omit<Major, 'rawBasicRequirements' | 'rawEndRequirements'> {
    isUserMajor: boolean;
    selectedCollegeId: string;
    selectedYear: string;
    basicRequirements: ProcessedRequirement[];
    concentrationRequirements?: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }>;
    endRequirements?: ProcessedRequirement[];
}

export interface CollegeInMajor {
    collegeId: string;
    name: string;
}

export interface RawBasicRequirement {
    year?: string;
    college?: string;
    requirements: string[];
}

export interface Concentration {
    concentrationName: string;
    requirements: string[];
}

export interface RawEndRequirement {
    year?: string;
    college?: string;
    requirements: string[];
}

/*
    Find a major by its _id
*/
export const findById = async (_id: string): Promise<Major | null> => {
    return await MajorModel.findOne({ _id });
};
