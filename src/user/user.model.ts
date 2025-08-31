// src/user/user.model.ts
// Data structure and MongoDB interactions

import { Document } from 'mongoose';
import { UserModel } from './user.schema';
import { Course } from '../course/course.model';

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
    courses: RawUserCourse[];
    
    // Authentication fields
    passwordHash?: string;
    role: 'student' | 'admin';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface RawUserCourse {
    _id: string;
    grpIdentifier?: string;
    usedInRequirements: Array<string>; // list of requirements that use this course
    credit?: number; // the credits gained (would gain) from this course
    semester?: string; // the semester that the course is planned or taken in
    sections?: Array<string>; // the sections of the course that the user is taking
  }

export interface CourseForFavorites extends Course {
    grpIdentifier?: string;
    usedInRequirements: Array<string>; // list of requirements that use this course
  }
  
  export interface CourseForSchedule extends CourseForFavorites {
    credit: number; // the credits gained (would gain) from this course
    semester: string; // the semester that the course is planned or taken in
    sections: Array<string>; // the sections of the course that the user is taking
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

export const isCourseForSchedule = (course: CourseForFavorites | CourseForSchedule): course is CourseForSchedule => {
    return 'semester' in course && 'credit' in course;
  }

