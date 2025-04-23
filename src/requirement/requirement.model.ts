// src/requirement/requirement.model.ts
// Data structure and Firebase interactions

import { db } from '../../db/firebase-admin';
import { CourseGroup, CourseInSchedule } from '../course/course.model';

// stored in the database
export interface Requirement {
    id: string;
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
export interface ProcessedRequirement {
    id: string;
    type: string;
    major: string;
    name: string;
    tag: string;
    tagDescr: string;
    descr: string[];
    number?: number; 
    overlap?: Array<string>;
    courses?: Array<string | {
        id: string;
        grpIdentifier: string;
    }>;
    courseGrps?: Array<CourseGroup>;

    // the folowing are added when the requirement is processed
    completed: boolean;
    takenCourses: CourseInSchedule[];
    plannedCourses: CourseInSchedule[];
    eligibleButNotUsedCourses: CourseInSchedule[];
}

const requirementsCollection = db.collection('requirements');

/*
    Find a requirement by its id
*/
export const findById = async (id: string): Promise<Requirement | null> => {
    const doc = await requirementsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Requirement;
};


