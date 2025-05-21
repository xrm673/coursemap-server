// src/user/user.service.ts
// Business logic for users

import * as UserModel from './user.model';
import { User } from './user.model'; 
import { CourseInSchedule } from '../course/course.model';
import { Major } from '../major/major.model';

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserError';
    }
}

export const getUser = async (uid: string): Promise<Omit<User, 'passwordHash'>> => {
    const user = await UserModel.findById(uid);
    if (!user) {
        throw new UserError('User not found');
    }
    const { passwordHash, ...userData } = user;
    return userData;
};

export const getUserCourses = async (
    userDetails: User
): Promise<CourseInSchedule[]> => {
    if (!userDetails.scheduleData) {
        return [];
    }

    // Flatten all courses from all semesters
    return userDetails.scheduleData.reduce((allCourses, semesterData) => {
        return [...allCourses, ...semesterData.courses];
    }, [] as CourseInSchedule[]);
};

export const getUserConcentrations = async (
    userDetails: User, 
    majorDetails: Major
): Promise<string[]> => {
    if (!userDetails.majors) {
        return [];
    }

    // Find the major in user's majors array
    const userMajor = userDetails.majors.find(major => major.id === majorDetails.id);
    
    // Return concentrations if found, otherwise empty array
    return userMajor?.concentrations || [];
};



