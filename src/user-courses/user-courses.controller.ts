// src/user-courses/user-courses.controller.ts
// Request handlers for user courses

import { Request, Response } from 'express';
import * as UserCoursesService from './user-courses.service';
import { CourseForFavorites, CourseForSchedule, isCourseForSchedule } from '../user/user.model';
import { CourseForRequirement } from '../course/course.model';

export const getCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const courses = await UserCoursesService.getCourses(requestingUser._id);
        res.status(200).json({ message: 'Courses fetched', userCourses: courses });
    } catch (error) {
        if (error instanceof UserCoursesService.UserCoursesError) {
            res.status(404).json({ error: error.message });
        } else {
            console.error('Error getting courses:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const addCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const {courseData, usedInRequirements, semester} = req.body;
        if (!courseData) {
            res.status(400).json({ error: 'Request body must be a non-empty array of courses' });
            return;
        }

        // Validate course
        if (!courseData._id) {
            res.status(400).json({ error: 'Course must have _id' });
            return;
        }
        if (!Array.isArray(usedInRequirements)) {
            res.status(400).json({ error: 'usedInRequirements must be an array' });
            return;
        }

        let updatedUserCourses: (CourseForSchedule | CourseForFavorites)[] | undefined;

        if (semester) {
            if (typeof semester !== 'string') {
                res.status(400).json({ error: 'Semester must be a string' });
                return;
            }
            updatedUserCourses = await UserCoursesService.addCourseToSchedule(requestingUser._id, courseData, semester, usedInRequirements);
        } else {
            updatedUserCourses = await UserCoursesService.saveCourse(requestingUser._id, courseData, usedInRequirements);
        }

        res.status(200).json({
            message: 'Courses added to schedule',
            courses: updatedUserCourses
        });
    } catch (error) {
        if (error instanceof UserCoursesService.UserCoursesError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error adding course to schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};



export const updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { courseId, grpIdentifier, updateData } = req.body;

        // Validate required fields
        if (!courseId) {
            res.status(400).json({ error: 'courseId is required' });
            return;
        }

        if (!updateData || typeof updateData !== 'object') {
            res.status(400).json({ error: 'updateData object is required' });
            return;
        }

        // Validate updateData fields
        const allowedFields = ['usedInRequirements', 'credit', 'semester', 'sections'];
        const providedFields = Object.keys(updateData);
        const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
            res.status(400).json({ 
                error: `Invalid fields in updateData: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}` 
            });
            return;
        }

        if (providedFields.length === 0) {
            res.status(400).json({ error: 'At least one field must be provided in updateData' });
            return;
        }

        // Validate field types
        if (updateData.credit !== undefined && updateData.credit !== null && typeof updateData.credit !== 'number') {
            res.status(400).json({ error: 'credit must be a number or null' });
            return;
        }

        if (updateData.semester !== undefined && updateData.semester !== null && typeof updateData.semester !== 'string') {
            res.status(400).json({ error: 'semester must be a string or null' });
            return;
        }

        if (updateData.usedInRequirements !== undefined && !Array.isArray(updateData.usedInRequirements)) {
            res.status(400).json({ error: 'usedInRequirements must be an array' });
            return;
        }

        if (updateData.sections !== undefined && !Array.isArray(updateData.sections)) {
            res.status(400).json({ error: 'sections must be an array' });
            return;
        }

        const updatedUser = await UserCoursesService.updateCourse(
            requestingUser._id, 
            courseId, 
            grpIdentifier, 
            updateData
        );

        res.status(200).json({
            message: 'Course updated successfully',
            courses: updatedUser.courses
        });
    } catch (error) {
        if (error instanceof UserCoursesService.UserCoursesError) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error updating course:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const courseData: CourseForRequirement = req.body;
        if (!courseData) {
            res.status(400).json({ error: 'Request body must be a non-empty array of courses' });
            return;
        }

        // Validate each course data
        if (!courseData._id) {
            res.status(400).json({ error: 'Each course must have _id' });
            return;
        }

        await UserCoursesService.deleteCourse(requestingUser._id, courseData);

        res.status(200).json({ message: 'Course deleted from schedule' });
    } catch (error) {
        if (error instanceof UserCoursesService.UserCoursesError) {
            if (error.message.includes('not found in schedule')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error deleting course from schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const removeCourseFromSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const courseData: CourseForSchedule = req.body;
        if (!courseData) {
            res.status(400).json({ error: 'Request body must be a non-empty schedule course object' });
            return;
        }

        if (!isCourseForSchedule(courseData)) {
            res.status(400).json({ error: 'Course must be a schedule course' });
            return;
        }

        // Validate each course data
        if (!courseData._id) {
            res.status(400).json({ error: 'Schedule course must have _id' });
            return;
        }

        const updatedUser = await UserCoursesService.removeCourseFromSchedule(requestingUser._id, courseData);

        res.status(200).json({ 
            message: 'Course removed from schedule',
            newUserCourses: updatedUser.courses
        });
    } catch (error) {
        if (error instanceof UserCoursesService.UserCoursesError) {
            if (error.message.includes('not found in schedule')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error deleting course from schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};