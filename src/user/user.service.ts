// src/user/user.service.ts
// Business logic for users

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

export const getUser = async (uid: string): Promise<Omit<User, 'passwordHash'>> => {
    const user = await UserModel.findById(uid);
    if (!user) {
        throw new UserError('User not found');
    }
    const { passwordHash, ...userData } = user;
    return userData;
};

export const getUserCourses = (userDetails: User): CourseInSchedule[] => {
    return userDetails.scheduleData || [];
};

export const getUserConcentrations = (
    userDetails: User, 
    majorDetails: Major
): string[] => {
    if (!userDetails.majors) {
        return [];
    }

    // Find the major in user's majors array
    const userMajor = userDetails.majors.find(major => major.id === majorDetails.id);
    
    // Return concentrations if found, otherwise empty array
    return userMajor?.concentrations || [];
};


export const getFavoredCourses = async (uid: string): Promise<CourseFavored[]> => {
    const user = await UserModel.findById(uid);
    if (!user) {
        throw new UserError('User not found');
    }
    
    return user.favoredCourses || [];
};


export const addFavoredCourse = async (uid: string, courseFavored: CourseFavored): Promise<User> => {
    try {
        const user = await UserModel.findById(uid);
        if (!user) {
            throw new UserError('User not found');
        }

        // Initialize favoredCourses array if it doesn't exist
        if (!user.favoredCourses) {
            user.favoredCourses = [];
        }

        // Create a clean favorite object without undefined values
        const newFavorite: CourseFavored = {
            id: courseFavored.id
        };
        
        // Only add grpIdentifier if it exists
        if (courseFavored.grpIdentifier) {
            newFavorite.grpIdentifier = courseFavored.grpIdentifier;
        }

        // Add the new favored course
        user.favoredCourses.push(newFavorite);

        // Update user document in Firebase
        try {
            await UserModel.usersCollection.doc(uid).update({
                favoredCourses: user.favoredCourses
            });
        } catch (updateError) {
            console.error('Firebase update error:', updateError);
            throw new Error('Failed to update favorites in database');
        }

        return user;
    } catch (error) {
        console.error('Full error in addFavoredCourse:', error);
        throw error;
    }
};


export const deleteFavoredCourse = async (uid: string, courseToDelete: CourseFavored): Promise<void> => {
    try {
        const user = await UserModel.findById(uid);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.favoredCourses) {
            throw new UserError('No favored courses found');
        }

        // Find index of the course that matches exactly (both courseId and grpIdentifier if present)
        const indexToDelete = user.favoredCourses.findIndex(course => {
            if (courseToDelete.grpIdentifier) {
                // If grpIdentifier is provided, both courseId and grpIdentifier must match
                return course.id === courseToDelete.id && 
                       course.grpIdentifier === courseToDelete.grpIdentifier;
            } else {
                // If no grpIdentifier provided, only match courses without grpIdentifier
                return course.id === courseToDelete.id && 
                       !course.grpIdentifier;
            }
        });

        if (indexToDelete === -1) {
            throw new UserError('Course not found in favorites');
        }

        // Remove the course
        user.favoredCourses.splice(indexToDelete, 1);

        // Update user document in Firebase
        await UserModel.usersCollection.doc(uid).update({
            favoredCourses: user.favoredCourses
        });
    } catch (error) {
        console.error('Error in deleteFavoredCourse:', error);
        throw error;
    }
};

export const addCourseToSchedule = async (uid: string, courseData: {
    courseId: string;
    semester: string;
    grpIdentifier?: string;
    credit: number;
    sections?: string[];
    usedInRequirements: string[];
}): Promise<User> => {
    try {
        const user = await UserModel.findById(uid);
        if (!user) {
            throw new UserError('User not found');
        }

        // Initialize scheduleData if it doesn't exist
        if (!user.scheduleData) {
            user.scheduleData = [];
        }

        // Check for exact duplicate in the same semester
        const isDuplicate = user.scheduleData.some(course => 
            course.semester === courseData.semester &&
            course.id === courseData.courseId &&
            (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
        );

        if (isDuplicate) {
            throw new UserError('This exact course is already in your schedule for this semester');
        }

        // Add the new course
        const newCourse: CourseInSchedule = {
            id: courseData.courseId,
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

        // Update user document in Firebase
        await UserModel.usersCollection.doc(uid).update({
            scheduleData: user.scheduleData
        });

        return user;
    } catch (error) {
        console.error('Error in addCourseToSchedule:', error);
        throw error;
    }
};

export const deleteCourseFromSchedule = async (uid: string, courseData: {
    courseId: string;
    semester: string;
    grpIdentifier?: string;
}): Promise<void> => {
    try {
        const user = await UserModel.findById(uid);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.scheduleData) {
            throw new UserError('No schedule data found');
        }

        // Find the course index
        const courseIndex = user.scheduleData.findIndex(course => 
            course.semester === courseData.semester &&
            course.id === courseData.courseId &&
            (!courseData.grpIdentifier || course.grpIdentifier === courseData.grpIdentifier)
        );

        if (courseIndex === -1) {
            throw new UserError('Course not found in schedule');
        }

        // Remove the course
        user.scheduleData.splice(courseIndex, 1);

        // Update user document in Firebase
        await UserModel.usersCollection.doc(uid).update({
            scheduleData: user.scheduleData
        });
    } catch (error) {
        console.error('Error in deleteCourseFromSchedule:', error);
        throw error;
    }
};



