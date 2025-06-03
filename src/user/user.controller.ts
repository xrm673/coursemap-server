// src/user/user.controller.ts
// Request handlers for users

import { Request, Response } from 'express';
import * as UserService from './user.service';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const userData = await UserService.getUser(requestingUser._id);
        res.status(200).json(userData);
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error getting user data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};


export const getFavoredCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const favoredCourses = await UserService.getFavoredCourses(requestingUser._id);
        res.status(200).json(favoredCourses);
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error getting favored courses:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};


export const addFavoredCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { courseId, grpIdentifier } = req.body;
        if (!courseId) {
            res.status(400).json({ error: 'courseId is required' });
            return;
        }

        const updatedUser = await UserService.addFavoredCourse(requestingUser._id, {
            _id: courseId,
            grpIdentifier
        });

        res.status(200).json({
            message: 'Course added to favorites',
            favoredCourses: updatedUser.favoredCourses
        });
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error adding course to favorites:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};


export const deleteFavoredCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { courseId, grpIdentifier } = req.body;
        if (!courseId) {
            res.status(400).json({ error: 'courseId is required' });
            return;
        }

        await UserService.deleteFavoredCourse(requestingUser._id, {
            _id: courseId,
            grpIdentifier
        });

        res.status(200).json({ message: 'Course removed from favorites' });
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Course not found in favorites') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        } else {
            console.error('Error deleting favored course:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const addCourseToSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const courseData = req.body;
        
        // Validate required fields
        if (!courseData._id || !courseData.semester || courseData.credit === undefined || !courseData.usedInRequirements) {
            res.status(400).json({ error: 'Missing required fields: id, semester, credit, and usedInRequirements are required' });
            return;
        }

        // Validate credit is a number
        if (typeof courseData.credit !== 'number') {
            res.status(400).json({ error: 'Credit must be a number' });
            return;
        }

        // Validate usedInRequirements is an array
        if (!Array.isArray(courseData.usedInRequirements)) {
            res.status(400).json({ error: 'usedInRequirements must be an array' });
            return;
        }

        // Validate sections if provided
        if (courseData.sections !== undefined && !Array.isArray(courseData.sections)) {
            res.status(400).json({ error: 'Sections must be an array' });
            return;
        }

        const updatedUser = await UserService.addCourseToSchedule(requestingUser._id, courseData);

        res.status(200).json({
            message: 'Course added to schedule',
            scheduleData: updatedUser.scheduleData
        });
    } catch (error) {
        if (error instanceof UserService.UserError) {
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

export const deleteCourseFromSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestingUser = req.user;
        if (!requestingUser) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { _id, semester, grpIdentifier } = req.body;
        
        // Validate required fields
        if (!_id || !semester) {
            res.status(400).json({ error: 'Missing required fields: courseId and semester are required' });
            return;
        }

        await UserService.deleteCourseFromSchedule(requestingUser._id, {
            _id,
            semester,
            grpIdentifier
        });

        res.status(200).json({ message: 'Course removed from schedule' });
    } catch (error) {
        if (error instanceof UserService.UserError) {
            if (error.message === 'User not found' || 
                error.message === 'Course not found in schedule' ||
                error.message === 'Semester not found in schedule') {
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

