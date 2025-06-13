// src/major/major.model.ts
// Data structure and MongoDB interactions

import { MajorModel } from './major.schema';

// stored in the database
export interface Major {
    _id: string;
    name: string;
    description?: string;
    needsYear: boolean;
    needsCollege: boolean;
    colleges: Array<CollegeInMajor>;
    numberOfRequiredCourses?: Number,
    rawBasicSections: Array<RawBasicSection>;
    rawConcentrations?: Array<RawConcentration>;
    rawEndSections?: Array<RawEndSection>;
    onboardingCourses: string[];
}

export interface CollegeInMajor {
    collegeId: string;
    name: string;
}

export interface RawBasicSection {
    year?: string;
    collegeId?: string;
    requirementIds: string[];
}

export interface RawConcentration {
    concentrationName: string;
    requirementIds: string[];
}

export interface RawEndSection {
    year?: string;
    collegeId?: string;
    requirementIds: string[];
}

/*
    Find a major by its _id
*/
export const findById = async (_id: string): Promise<Major | null> => {
    return await MajorModel.findOne({ _id });
};

/*
    Find all majors, optionally filtered by collegeId
*/
export const find = async (collegeId?: string): Promise<Major[]> => {
    if (collegeId) {
        return await MajorModel.find({ 'colleges.collegeId': collegeId }).lean();
    }
    return await MajorModel.find().lean();
};
