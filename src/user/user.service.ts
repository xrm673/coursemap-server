// src/user/user.service.ts
// Business logic for users

import * as UserModel from './user.model';
import { User, RawCourseFavored, RawCourseInSchedule } from './user.model'; 
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


export const addFavoredCourse = async (userId: string, courseFavored: RawCourseFavored): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.favoredCourses) {
            user.favoredCourses = [];
        }

        const newFavorite: RawCourseFavored = {
            _id: courseFavored._id
        };
        
        if (courseFavored.grpIdentifier) {
            newFavorite.grpIdentifier = courseFavored.grpIdentifier;
        }

        user.favoredCourses.push(newFavorite);
        await user.save();

        return user;
    } catch (error) {
        console.error('Full error in addFavoredCourse:', error);
        throw error;
    }
};

export const deleteFavoredCourse = async (userId: string, courseToDelete: RawCourseFavored): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.favoredCourses) {
            throw new UserError('No favored courses found');
        }

        const indexToDelete = user.favoredCourses.findIndex(course => {
            if (courseToDelete.grpIdentifier) {
                return course._id === courseToDelete._id && 
                       course.grpIdentifier === courseToDelete.grpIdentifier;
            } else {
                return course._id === courseToDelete._id && 
                       !course.grpIdentifier;
            }
        });

        if (indexToDelete === -1) {
            throw new UserError('Course not found in favorites');
        }

        user.favoredCourses.splice(indexToDelete, 1);
        await user.save();
    } catch (error) {
        console.error('Error in deleteFavoredCourse:', error);
        throw error;
    }
};

export const addCoursesToSchedule = async (userId: string, coursesData: RawCourseInSchedule[]): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.scheduleData) {
            user.scheduleData = [];
        }

        for (const courseData of coursesData) {
            const isDuplicate = user.scheduleData.some(course => 
                course.semester === courseData.semester &&
                course._id === courseData._id &&
                (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
            );

            if (!isDuplicate) {
                const newCourse: RawCourseInSchedule = {
                    _id: courseData._id,
                    semester: courseData.semester,
                    credit: courseData.credit,
                    usedInRequirements: courseData.usedInRequirements
                };
                if (courseData.grpIdentifier) {
                    newCourse.grpIdentifier = courseData.grpIdentifier;
                }
                user.scheduleData.push(newCourse);
            }
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error in addCoursesToSchedule:', error);
        throw error;
    }
};


export const deleteCoursesFromSchedule = async (userId: string, coursesData: Array<{
    _id: string;
    semester: string;
    grpIdentifier?: string;
}>): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.scheduleData) {
            throw new UserError('No schedule data found');
        }

        let notFoundCourses: string[] = [];

        for (const courseData of coursesData) {
            const courseIndex = user.scheduleData.findIndex(course => 
                course.semester === courseData.semester &&
                course._id === courseData._id &&
                (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
            );

            if (courseIndex === -1) {
                notFoundCourses.push(`${courseData._id} (${courseData.semester})`);
            } else {
                user.scheduleData.splice(courseIndex, 1);
            }
        }

        if (notFoundCourses.length > 0) {
            throw new UserError(`The following courses were not found in schedule: ${notFoundCourses.join(', ')}`);
        }

        await user.save();
    } catch (error) {
        console.error('Error in deleteCoursesFromSchedule:', error);
        throw error;
    }
};




