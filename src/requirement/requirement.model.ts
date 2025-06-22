// src/requirement/requirement.model.ts
// Data structure and MongoDB interactions

import { RequirementModel } from './requirement.schema';

// stored in the database
export interface Requirement {
    _id: string;
    type: string;
    programId: string;
    year?: number;
    collegeId?: string;
    concentrationName?: string;
    name: string;
    descr: string[];
    totalCoursesRequired?: number; // total number of courses required
    totalCreditsRequired?: number; // total number of credits required (if useCredit is true)
    // an array of course ids (for elective requirements)
    courseIds?: Array<string>
    courseNotes?: Array<CourseNote>;
    // an array of course groups (for core requirements)
    totalGroupsRequired?: number; // total number of groups required
    courseGrps?: Array<CourseGroup>;
    overlap?: Array<string>; // overlap requirement ids
}

export interface CourseGroup {
    _id: number;
    topic?: string;
    nbrOfCoursesRequired: number;
    courseIds: Array<string>;
    noUpperLimit?: boolean;
    notes?: string;
}

export interface CourseNote {
    courseId: string;
    grpIdentifierArray?: string[];
    noteForRequirement?: string;
    recommendedByDepartment?: boolean;
}

export const findById = async (id: string): Promise<Requirement | null> => {
    const requirement = await RequirementModel.findOne({ id }).lean();
    if (!requirement) return null;
    return requirement;
};

export const findByIds = async (_ids: string[]): Promise<Requirement[]> => {
    return await RequirementModel.find({ _id: { $in: _ids } }).lean();
};


