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

