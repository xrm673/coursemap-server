// src/user/user.model.ts
// Data structure and MongoDB interactions

import { Document } from 'mongoose';
import { UserModel } from './user.schema';

export interface UserCollege {
    collegeId: string;
    name: string;
}

export interface UserMajor {
    majorId: string;
    name: string;
    concentrationNames?: string[];
    trackName?: string;
}

export interface UserMinor {
    minorId: string;
    name: string;
    concentrationNames?: string[];
    trackName?: string;
}

// Define the interface for User document
export interface User extends Document {
    email: string;
    netid: string;
    firstName: string;
    lastName: string;
    year: string;
    semesters: string[];
    college: UserCollege;
    majors: UserMajor[];
    minors: UserMinor[];
    scheduleData?: RawCourseInSchedule[];
    favoredCourses?: RawCourseFavored[];
    
    // Authentication fields
    passwordHash?: string;
    role: 'student' | 'admin';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface RawCourseFavored {
    _id: string;
    grpIdentifier?: string;
}

export interface RawCourseInSchedule {
    _id: string;
    grpIdentifier?: string; // must be specified if course has topic
    usedInRequirements: Array<string>; // list of requirements that use this course
    credit: number; // the credits gained (would gain) from this course
    semester: string; // the semester that the course is planned or taken in
}

// Export database operations as functions
export const findById = async (id: string): Promise<User | null> => {
    return UserModel.findById(id);
};

export const createUser = async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const user = new UserModel(userData);
    return user.save();
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    return UserModel.findOne({ email });
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
        lastLogin: new Date(),
        updatedAt: new Date()
    });
};

