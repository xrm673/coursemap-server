// src/user/user.service.ts
// Business logic for users

import { ObjectId } from 'mongodb';
import * as UserModel from './user.model';
import { User } from './user.model'; 
import { CourseInSchedule, CourseFavored } from '../course/course.model';
import { Major } from '../major/major.model';
import { getDatabase } from '../db/mongodb';

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserError';
    }
}

export const getUser = async (userId: string): Promise<Omit<User, 'passwordHash'>> => {
    const user = await UserModel.findById(new ObjectId(userId));
    if (!user) {
        throw new UserError('User not found');
    }
    const { passwordHash, ...userData } = user;
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


export const getFavoredCourses = async (uid: string): Promise<CourseFavored[]> => {
    const user = await UserModel.findById(new ObjectId(uid));
    if (!user) {
        throw new UserError('User not found');
    }
    return user.favoredCourses || [];
};


export const addFavoredCourse = async (uid: string, courseFavored: CourseFavored): Promise<User> => {
    try {
        const user = await UserModel.findById(new ObjectId(uid));
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

        const db = getDatabase();
        await db.collection(UserModel.USERS_COLLECTION).updateOne(
            { _id: new ObjectId(uid) },
            { $set: { favoredCourses: user.favoredCourses } }
        );

        return user;
    } catch (error) {
        console.error('Full error in addFavoredCourse:', error);
        throw error;
    }
};


export const deleteFavoredCourse = async (uid: string, courseToDelete: CourseFavored): Promise<void> => {
    try {
        const user = await UserModel.findById(new ObjectId(uid));
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

        const db = getDatabase();
        await db.collection(UserModel.USERS_COLLECTION).updateOne(
            { _id: new ObjectId(uid) },
            { $set: { favoredCourses: user.favoredCourses } }
        );
    } catch (error) {
        console.error('Error in deleteFavoredCourse:', error);
        throw error;
    }
};

export const addCourseToSchedule = async (uid: string, courseData: CourseInSchedule): Promise<User> => {
    try {
        const user = await UserModel.findById(new ObjectId(uid));
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

        const db = getDatabase();
        await db.collection(UserModel.USERS_COLLECTION).updateOne(
            { _id: new ObjectId(uid) },
            { $set: { scheduleData: user.scheduleData } }
        );

        return user;
    } catch (error) {
        console.error('Error in addCourseToSchedule:', error);
        throw error;
    }
};

export const deleteCourseFromSchedule = async (uid: string, courseData: {
    _id: string;
    semester: string;
    grpIdentifier?: string;
}): Promise<void> => {
    try {
        const user = await UserModel.findById(new ObjectId(uid));
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

        const db = getDatabase();
        await db.collection(UserModel.USERS_COLLECTION).updateOne(
            { _id: new ObjectId(uid) },
            { $set: { scheduleData: user.scheduleData } }
        );
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
}



