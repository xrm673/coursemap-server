// src/major/major.model.ts
// Data structure and Firebase interactions

import { ProcessedRequirement } from '../requirement/requirement.model';
import { db } from '../../db/firebase-admin';


// stored in the database
export interface Major {
    id: string;
    name: string;
    description?: string;
    needsYear: boolean;
    needsCollege: boolean;
    basicRequirements: Array<{
        year?: number;
        college?: string;
        requirements: string[];
    }>;
    concentrations?: Array<{
        concentration: string;
        requirements: string[];
    }>;
    endRequirements?: Array<{
        year?: number;
        college?: string;
        requirements: string[];
    }>;
    init: string[];
    requiredCourses?: number;
    // other fields...
}

// provided to frontend
export interface ProcessedMajor {
    id: string;
    name: string;
    description?: string;
    needsYear: boolean;
    needsCollege: boolean;
    requiredCourses?: number;
    basicRequirements: ProcessedRequirement[];
    concentrationRequirements?: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }>;
    endRequirements?: ProcessedRequirement[];
}

const majorsCollection = db.collection('majors');

/*
    Find a major by its id
*/
export const findById = async (id: string): Promise<Major | null> => {
    const doc = await majorsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Major;
};
