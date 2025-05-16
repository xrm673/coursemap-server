// src/user/user.model.ts
// Data structure and Firebase interactions

import { CourseInSchedule } from '../course/course.model';
import { db } from '../../db/firebase-admin';


export interface User {
    id: string;
    netid?: string;
    name: string;
    year: number;
    college: string;
    majors?: Array<{
        id: string;
        name: string;
        college: string;
        concentrations: Array<string>;
    }>;
    scheduleData?: Array<{
        semester: string;
        courses: CourseInSchedule[];
    }>;
}

const usersCollection = db.collection('users');

/*
    Find a user by their NetID
*/
export const findById = async (netid: string): Promise<User | null> => {
    const doc = await usersCollection.doc(netid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
};

