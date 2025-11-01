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

export const addCoursesToSchedule = async (userId: string, coursesData: (CourseForSchedule | CourseForFavorites)[]): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            user.courses = [];
        }

        for (const courseData of coursesData) {
            if (isCourseForSchedule(courseData)) {
                const isDuplicate = user.courses.some(course => 
                    course.semester === courseData.semester &&
                    course._id === courseData._id &&
                    (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
                );
                if (!isDuplicate) {
                    const newCourse: RawUserCourse = {
                        _id: courseData._id,
                        considered: courseData.considered,
                        semester: courseData.semester,
                        credit: courseData.credit,
                        usedInRequirements: courseData.usedInRequirements
                    };
                    if (courseData.grpIdentifier) {
                        newCourse.grpIdentifier = courseData.grpIdentifier;
                    }
                    user.courses.push(newCourse);
                }

            } else {
                const isDuplicate = user.courses.some(course => 
                    course._id === courseData._id &&
                    (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
                );

                if (!isDuplicate) {
                    const newCourse: RawUserCourse = {
                        _id: courseData._id,
                        usedInRequirements: courseData.usedInRequirements,
                        considered: courseData.considered,
                    };
                    if (courseData.grpIdentifier) {
                        newCourse.grpIdentifier = courseData.grpIdentifier;
                    }
                    user.courses.push(newCourse);
                }
            }
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error in addCoursesToSchedule:', error);
        throw error;
    }
};


export const removeCoursesFromSchedule = async (userId: string, coursesData: (CourseForSchedule | CourseForFavorites)[]): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            throw new UserError('No schedule data found');
        }

        let notFoundCourses: string[] = [];

        for (const courseData of coursesData) {
            if (isCourseForSchedule(courseData)) {
                const courseIndex = user.courses.findIndex(course => 
                    course.semester === courseData.semester &&
                    course._id === courseData._id &&
                    (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
                );

                if (courseIndex === -1) {
                    notFoundCourses.push(`${courseData._id} (${courseData.semester})`);
                } else {
                    user.courses.splice(courseIndex, 1);
                }
            } else {
                const courseIndex = user.courses.findIndex(course => 
                    course._id === courseData._id &&
                    (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
                );

                if (courseIndex === -1) {
                    notFoundCourses.push(`${courseData._id}`);
                } else {
                    user.courses.splice(courseIndex, 1);
                }
            }
        }

        if (notFoundCourses.length > 0) {
            throw new UserError(`The following courses were not found in schedule: ${notFoundCourses.join(', ')}`);
        }

        await user.save();
    } catch (error) {
        console.error('Error in removeCoursesFromSchedule:', error);
        throw error;
    }
};




