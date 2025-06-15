import { ProgramModel } from "./program.schema";``

export interface BaseProgram {
    _id: string;
    name: string;
    type: "major" | "minor" | "college";
    description?: string;
    needsYear: boolean;
    needsMajor: boolean;
    needsCollege: boolean;
    rawBasicSections: Array<RawBasicSection>;
}

export interface Major extends BaseProgram {
    type: "major";
    colleges: Array<CollegeInProgram>;
    needsMajor: false;
    onboardingCourses: string[];
    rawConcentrations?: Array<RawConcentration>;
    rawEndSections?: Array<RawEndSection>;
    numberOfRequiredCourses?: Number,
}

export interface Minor extends BaseProgram {
    type: "minor";
    colleges: Array<CollegeInProgram>;
    onboardingCourses: string[];
    numberOfRequiredCourses?: Number,
}

export interface College extends BaseProgram {
    type: "college";
    majors: MajorInCollege[];
    needsCollege: false;
}

export interface MajorInCollege {
    majorId: string;
    name: string;
}

export interface CollegeInProgram {
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

export type Program = Major | Minor | College;

/*
    Find all programs, optionally filtered by collegeId
*/
export const find = async (collegeId?: string): Promise<Program[]> => {
    if (collegeId) {
        return await ProgramModel.find({ 'colleges.collegeId': collegeId }).lean();
    }
    return await ProgramModel.find().lean();
};

/*
    Find a program by its _id
*/
export const findById = async (_id: string): Promise<Program | null> => {
    return await ProgramModel.findOne({ _id }).lean();
};