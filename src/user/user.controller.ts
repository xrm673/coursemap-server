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

