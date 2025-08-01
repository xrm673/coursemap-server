// src/user/user.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserController from './user.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getUser);
userRouter.patch('/me', authenticate, UserController.updateUser);

userRouter.post('/me/courses', authenticate, UserController.addCoursesToSchedule);
userRouter.delete('/me/courses', authenticate, UserController.removeCoursesFromSchedule);

export { userRouter };

