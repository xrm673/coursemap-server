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
        const userData = await UserService.getUser(requestingUser.uid);
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

        const favoredCourses = await UserService.getFavoredCourses(requestingUser.uid);
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

        const updatedUser = await UserService.addFavoredCourse(requestingUser.uid, {
            id: courseId,
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

        await UserService.deleteFavoredCourse(requestingUser.uid, {
            id: courseId,
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

