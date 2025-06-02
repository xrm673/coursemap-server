// src/user/user.model.ts
// Data structure and MongoDB interactions

import { ObjectId } from 'mongodb';
import { CourseFavored, CourseInSchedule } from '../course/course.model';
import { getDatabase } from '../db/mongodb';

export interface User {
    _id?: ObjectId;  // MongoDB document ID
    email: string;
    netid: string; 
    firstName: string;
    lastName: string;
    year: string;
    college: UserCollege;
    majors: UserMajor[];
    scheduleData?: CourseInSchedule[];
    favoredCourses?: CourseFavored[];
    
    // Authentication fields
    passwordHash: string;
    role: 'student' | 'admin';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCollege {
    collegeId: string;
    name: string;
}

export interface UserMajor {
    majorId: string;
    name: string;
    concentrationNames: string[];
}

// MongoDB collection name
export const USERS_COLLECTION = 'users';

// MongoDB indexes
export const USER_INDEXES = [
    { key: { email: 1 }, unique: true },
    { key: { netid: 1 }, unique: true }
];

// MongoDB database operations
export const findById = async (id: ObjectId): Promise<User | null> => {
    const db = getDatabase();
    const collection = db.collection(USERS_COLLECTION);
    const user = await collection.findOne({ _id: id });
    return user as User | null;
};

export const createUser = async (userData: Omit<User, '_id'>): Promise<User> => {
    const db = getDatabase();
    const collection = db.collection(USERS_COLLECTION);
    
    const now = new Date();
    const userWithTimestamps = {
        ...userData,
        createdAt: now,
        updatedAt: now
    };

    const result = await collection.insertOne(userWithTimestamps);
    return { _id: result.insertedId, ...userWithTimestamps };
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const db = getDatabase();
    const collection = db.collection(USERS_COLLECTION);
    
    const user = await collection.findOne({ email });
    return user as User | null;
};

export const updateUserLastLogin = async (userId: ObjectId): Promise<void> => {
    const db = getDatabase();
    const collection = db.collection(USERS_COLLECTION);
    
    await collection.updateOne(
        { _id: userId },
        { 
            $set: { 
                lastLogin: new Date(),
                updatedAt: new Date()
            }
        }
    );
};

