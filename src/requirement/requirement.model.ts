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
    reqRequiredCoursesCount: number; // total number of courses required
    // an array of course ids (for elective requirements)
    courseIds?: Array<string>
    courseNotes?: Array<CourseNote>;
    // an array of course groups (for core requirements)
    reqRequiredGroupsCount?: number; // total number of groups required
    courseGrps?: Array<CourseGroup>;
    overlap?: Array<string>; // overlap requirement ids
}

export interface CourseGroup {
    _id: number;
    topic?: string;
    groupRequiredCoursesCount: number;
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


