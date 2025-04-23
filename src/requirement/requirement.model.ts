// src/requirement/requirement.model.ts
// Data structure and Firebase interactions

import { db } from '../../db/firebase-admin';
import { Course, CourseGroup, CourseGroupProcessed, NoDataCourse } from '../course/course.model';

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
    
    coursesDetails: Array<Course | NoDataCourse>; // changed from an array of strings to an array of Course objects
    courseGrpsDetails: CourseGroupProcessed[]; 
    completed: boolean;
    takenCourses: Course[];
    plannedCourses: Course[];
    eligibleButNotUsedCourses: Course[];
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


