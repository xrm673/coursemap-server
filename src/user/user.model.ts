// src/user/user.model.ts
// Data structure and MongoDB interactions

import mongoose, { Schema, Types, Document } from 'mongoose';
import { CourseFavored, CourseInSchedule } from '../course/course.model';
import { UserModel } from './user.schema';

export interface UserCollege {
    collegeId: string;
    name: string;
}

export interface UserMajor {
    majorId: string;
    name: string;
    concentrationNames?: string[];
}

// Define the interface for User document
export interface User extends Document {
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
    passwordHash?: string;
    role: 'student' | 'admin';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
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

