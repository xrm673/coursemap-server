import { ProgramModel } from "./program.schema";``

export interface BaseProgram {
    _id: string;
    name: string;
    type: "major" | "minor" | "college";
    description?: string;
    yearDependent: boolean;
    majorDependent: boolean;
    collegeDependent: boolean;
    trackDependent: boolean;
    totalCoursesRequired?: Number;
    concentrationNames?: string[];
    trackNames?: string[];
    rawReqSets?: Array<RawReqSet>;
    onboardingCourses?: string[];
}

export interface Major extends BaseProgram {
    type: "major";
    colleges: Array<CollegeInProgram>;
    majorDependent: false;
}

export interface Minor extends BaseProgram {
    type: "minor";
    colleges: Array<CollegeInProgram>;
}

export interface College extends BaseProgram {
    type: "college";
    majors: MajorInCollege[];
    collegeDependent: false;
}

export interface MajorInCollege {
    majorId: string;
    name: string;
}

export interface CollegeInProgram {
    collegeId: string;
    name: string;
}

export interface RawReqSet {
    years?: string[];
    collegeIds?: string[];
    trackNames?: string[];
    rawReqList: Array<string | RawCategorySection>;
}

export interface RawCategorySection {
    sectionName: string;
    sectionRequiredCategoriesCount: number;
    sectionRequiredCoursesCount?: number;

    isConcentration: boolean;

    // When true: total courses completed = sum of courses completed of all categories
    // When false: total courses completed = highest number of courses completed in any single category
    aggregateBySum: boolean;

    categories: Array<RawCategory>;
}

export interface RawCategory {
    categoryName: string;
    categoryRequiredCoursesCount: number;
    hasUpperLimit: boolean; // true if courses can't be used for the category section if the category is completed
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