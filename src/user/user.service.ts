// src/user/user.service.ts
// Business logic for users

import * as UserModel from './user.model';
import { User, RawUserCourse, CourseForFavorites, CourseForSchedule, isCourseForSchedule } from './user.model'; 
import { Major } from '../program/program.model';

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserError';
    }
}

export const getUser = async (userId: string): Promise<Omit<User, 'passwordHash'>> => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new UserError('User not found');
    }
    const { passwordHash, ...userData } = user.toObject();
    return userData;
};

// Partial update of user document
export const updateUser = async (userId: string, updates: Partial<Omit<User, '_id' | 'passwordHash' | 'role' | 'createdAt' | 'updatedAt'>>): Promise<User> => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new UserError('User not found');
    }

    // Only update fields that are provided
    Object.keys(updates).forEach((key) => {
        if (key in user && key !== '_id' && key !== 'passwordHash' && key !== 'role') {
            (user as any)[key] = (updates as any)[key];
        }
    });

    await user.save();
    return user;
};




