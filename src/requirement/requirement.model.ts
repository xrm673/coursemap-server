// src/requirement/requirement.model.ts
// Data structure and MongoDB interactions

import { RequirementModel } from './requirement.schema';
import { CourseGroup, FetchedCourseInSchedule } from '../course/course.model';

// stored in the database
export interface Requirement {
    _id: string;
    type: string;
    major: string;
    name: string;
    tag: string;
    tagDescr: string;
    descr: string[];
    number?: number; // total number of courses required
    // an array of course ids / id with grpIdentifier (for elective requirements)
    courses?: Array<string | {
        id: string;
        grpIdentifier: string;
    }>;
    // an array of course groups (for core requirements)
    courseGrps?: Array<CourseGroup>;
    overlap?: Array<string>; // overlap requirement ids
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

/*
    Find multiple requirements by their IDs
*/
export const findByIds = async (_ids: string[]): Promise<Requirement[]> => {
    return await RequirementModel.find({ _id: { $in: _ids } });
};


