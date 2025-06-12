// src/requirement/requirement.model.ts
// Data structure and MongoDB interactions

import { RequirementModel } from './requirement.schema';
import { CourseInSchedule } from '../course/course.model';

// stored in the database
export interface Requirement {
    _id: string;
    type: string;
    majorId: string;
    year?: number;
    collegeId?: string;
    concentrationName?: string;
    name: string;
    descr: string[];
    numberOfRequiredCourses?: number; // total number of courses required
    useCredit?: boolean; // whether to use credit to calculate the number of courses required
    numberOfRequiredCredits?: number; // total number of credits required (if useCredit is true)
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

export interface ProcessedCourseGroup extends CourseGroup {
    completed: boolean;
}

// processed requirement
export interface ProcessedRequirement extends Requirement {
    completed: boolean;
    courseGrps?: ProcessedCourseGroup[];
    taken: CourseInSchedule[];
    planned: CourseInSchedule[];
    takenNotUsed: CourseInSchedule[];
    plannedNotUsed: CourseInSchedule[];
}

export const findById = async (id: string): Promise<Requirement | null> => {
    const requirement = await RequirementModel.findOne({ id }).lean();
    if (!requirement) return null;
    return requirement;
};

export const findByIds = async (_ids: string[]): Promise<Requirement[]> => {
    return await RequirementModel.find({ _id: { $in: _ids } }).lean();
};


