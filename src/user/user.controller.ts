// src/user/user.controller.ts
// Request handlers for users

import { Request, Response } from 'express';
import * as UserService from './user.service';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const { netid } = req.params;
    const user = await UserService.getUser(netid);
    res.status(200).json(user);
};

