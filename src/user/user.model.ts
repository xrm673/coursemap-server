// src/user/user.model.ts
// Data structure and Firebase interactions

import { CourseFavored, CourseInSchedule } from '../course/course.model';
import { db } from '../../db/firebase-admin';

export interface User {
    uid?: string;  // Optional since it's set during creation
    email?: string;
    netid?: string; 
    firstName?: string;
    lastName?: string;
    year?: string;
    collegeId?: string;
    majors?: Array<{
        id: string;
        name: string;
        collegeId: string;
        concentrations?: Array<string>;
    }>;
    scheduleData?: Array<{
        semester: string;
        courses: CourseInSchedule[];
    }>;
    favoredCourses?: CourseFavored[];
    preferences?: {
        theme?: string;
        notifications?: boolean;
        // Add other user preferences as needed
    };
    // Authentication fields
    passwordHash?: string;
    role?: 'student' | 'admin';
    lastLogin?: Date;
}

export const usersCollection = db.collection('users');

/*
    Find a user by their Firebase UID
*/
export const findById = async (uid: string): Promise<User | null> => {
    const doc = await usersCollection.doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() } as User;
};

