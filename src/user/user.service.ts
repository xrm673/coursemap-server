// src/user/user.service.ts
// Business logic for users

import * as UserModel from './user.model';
import { User } from './user.model';
import * as CourseModel from '../course/course.model';
import { Course, CourseInSchedule } from '../course/course.model';
import { Major } from '../major/major.model';

export const getUser = async (netid: string): Promise<User> => {
    const user = await UserModel.findById(netid);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
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



