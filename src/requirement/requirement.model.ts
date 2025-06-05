// src/requirement/requirement.model.ts
// Data structure and MongoDB interactions

import { RequirementModel } from './requirement.schema';
import { FetchedCourseInSchedule } from '../course/course.model';

// stored in the database
export interface Requirement {
    _id: string;
    type: string;
    majorId: string;
    name: string;
    tag: string;
    tagDescr: string;
    descr: string[];
    numberOfRequiredCourses?: number; // total number of courses required
    // an array of course ids (for elective requirements)
    courseIds?: Array<string>
    courseNotes?: Array<CourseNote>;
    // an array of course groups (for core requirements)
    courseGrps?: Array<CourseGroup>;
    overlap?: Array<string>; // overlap requirement ids
}

export interface CourseGroup {
    _id: number;
    topic?: string;
    courseIds: Array<string>;
    notes?: string;
}

export interface CourseNote {
    courseId: string;
    grpIdentifierArray?: string[];
    noteForRequirement?: string;
    recommendedByDepartment?: boolean;
}

// processed requirement
export interface ProcessedRequirement extends Requirement {
    completed: boolean;
    takenCourses: FetchedCourseInSchedule[];
    plannedCourses: FetchedCourseInSchedule[];
    eligibleButNotUsedCourses: FetchedCourseInSchedule[];
}

export const findById = async (id: string): Promise<Requirement | null> => {
    const requirement = await RequirementModel.findOne({ id });
    if (!requirement) return null;
    return requirement;
};

export const findByIds = async (_ids: string[]): Promise<Requirement[]> => {
    return await RequirementModel.find({ _id: { $in: _ids } });
};


