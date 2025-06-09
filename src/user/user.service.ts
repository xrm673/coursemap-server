// src/user/user.service.ts
// Business logic for users

import { Types } from 'mongoose';
import * as UserModel from './user.model';
import { User } from './user.model'; 
import { CourseInSchedule, CourseFavored } from '../course/course.model';
import { Major } from '../major/major.model';

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

export const getUserCourses = (user: User): CourseInSchedule[] => {
    return user.scheduleData || [];
};

export const getUserConcentrations = (
    user: User, 
    major: Major
): string[] => {
    if (!user.majors) {
        return [];
    }

    // Find the major in user's majors array
    const userMajor = user.majors.find(userMajor => userMajor.majorId === major._id);
    
    // Return concentrations if found, otherwise empty array
    return userMajor?.concentrationNames || [];
};

export const getFavoredCourses = async (userId: string): Promise<CourseFavored[]> => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new UserError('User not found');
    }
    return user.favoredCourses || [];
};

export const addFavoredCourse = async (userId: string, courseFavored: CourseFavored): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.favoredCourses) {
            user.favoredCourses = [];
        }

        const newFavorite: CourseFavored = {
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

export const deleteFavoredCourse = async (userId: string, courseToDelete: CourseFavored): Promise<void> => {
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

export const addCourseToSchedule = async (userId: string, courseData: CourseInSchedule): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.scheduleData) {
            user.scheduleData = [];
        }

        const isDuplicate = user.scheduleData.some(course => 
            course.semester === courseData.semester &&
            course._id === courseData._id &&
            (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
        );

        if (isDuplicate) {
            throw new UserError('This exact course is already in your schedule for this semester');
        }

        const newCourse: CourseInSchedule = {
            _id: courseData._id,
            tts: courseData.tts,
            semester: courseData.semester,
            credit: courseData.credit,
            usedInRequirements: courseData.usedInRequirements
        };

        if (courseData.grpIdentifier) {
            newCourse.grpIdentifier = courseData.grpIdentifier;
        }

        if (courseData.sections) {
            newCourse.sections = courseData.sections;
        }

        user.scheduleData.push(newCourse);
        await user.save();

        return user;
    } catch (error) {
        console.error('Error in addCourseToSchedule:', error);
        throw error;
    }
};

export const deleteCourseFromSchedule = async (userId: string, courseData: {
    _id: string;
    semester: string;
    grpIdentifier?: string;
}): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.scheduleData) {
            throw new UserError('No schedule data found');
        }

        const courseIndex = user.scheduleData.findIndex(course => 
            course.semester === courseData.semester &&
            course._id === courseData._id &&
            (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
        );

        if (courseIndex === -1) {
            throw new UserError('Course not found in schedule');
        }

        user.scheduleData.splice(courseIndex, 1);
        await user.save();
    } catch (error) {
        console.error('Error in deleteCourseFromSchedule:', error);
        throw error;
    }
};

export const checkIsUserMajor = (user: User, majorId: string): boolean => {
    if (!user.majors) {
        return false;
    }

    return user.majors.some(userMajor => userMajor.majorId === majorId);
};

// Full update of user document
export const updateUser = async (userId: string, userData: Omit<User, '_id' | 'passwordHash' | 'role' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new UserError('User not found');
    }

    // Update allowed fields
    user.email = userData.email;
    user.netid = userData.netid;
    user.firstName = userData.firstName;
    user.lastName = userData.lastName;
    user.year = userData.year;
    user.college = userData.college;
    user.majors = userData.majors;
    user.scheduleData = userData.scheduleData;
    user.favoredCourses = userData.favoredCourses;

    await user.save();
    return user;
};

// Partial update of user document
export const partialUpdateUser = async (userId: string, updates: Partial<Omit<User, '_id' | 'passwordHash' | 'role' | 'createdAt' | 'updatedAt'>>): Promise<User> => {
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



