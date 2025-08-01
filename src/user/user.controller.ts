// src/user/user.controller.ts
// Request handlers for users

import { Request, Response } from 'express';
import * as UserService from './user.service';
import { User, RawUserCourse, CourseForFavorites, CourseForSchedule, isCourseForSchedule } from './user.model';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await UserService.getUser(req.user!._id);
        res.json(user);
    } catch (error) {
        if (error instanceof UserService.UserError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedUser = await UserService.updateUser(req.user!._id, req.body);
        res.json(updatedUser);
    } catch (error) {
        if (error instanceof UserService.UserError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

export const addCoursesToSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const coursesData: (CourseForSchedule | CourseForFavorites)[] = req.body;
        if (!Array.isArray(coursesData) || coursesData.length === 0) {
            res.status(400).json({ error: 'Request body must be a non-empty array of courses' });
            return;
        }

        // Validate each course
        for (const courseData of coursesData) {
            if (!Array.isArray(courseData.usedInRequirements)) {
                res.status(400).json({ error: 'usedInRequirements must be an array for each course' });
                return;
            }
            if (isCourseForSchedule(courseData)) {
                if (!courseData._id || !courseData.semester || courseData.credit === undefined || !courseData.usedInRequirements) {
                    res.status(400).json({ error: 'Each course must have _id, semester, credit, and usedInRequirements' });
                    return;
                }
                if (typeof courseData.credit !== 'number') {
                    res.status(400).json({ error: 'Credit must be a number for each course' });
                    return;
                }
                if (courseData.sections !== undefined && !Array.isArray(courseData.sections)) {
                    res.status(400).json({ error: 'Sections must be an array if provided for each course' });
                    return;
                }
            }
        }

        const updatedUser = await UserService.addCoursesToSchedule(requestingUser._id, coursesData);

        res.status(200).json({
            message: 'Courses added to schedule',
            courses: updatedUser.courses
        });
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error adding courses to schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};



export const removeCoursesFromSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const coursesData: (CourseForSchedule | CourseForFavorites)[] = req.body;
        if (!Array.isArray(coursesData) || coursesData.length === 0) {
            res.status(400).json({ error: 'Request body must be a non-empty array of courses' });
            return;
        }

        // Validate each course data
        for (const courseData of coursesData) {
            if (!courseData._id) {
                res.status(400).json({ error: 'Each course must have _id' });
                return;
            }
            if (isCourseForSchedule(courseData)) {
                if (!courseData.semester) {
                    res.status(400).json({ error: 'Each course must have _id and semester' });
                    return;
                }
            }
        }

        await UserService.removeCoursesFromSchedule(requestingUser._id, coursesData);

        res.status(200).json({ message: 'Courses removed from schedule' });
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message.includes('not found in schedule')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error deleting courses from schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

