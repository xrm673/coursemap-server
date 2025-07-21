// src/user/user.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserController from './user.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getUser);
userRouter.patch('/me', authenticate, UserController.updateUser);

userRouter.post('/me/favorites', authenticate, UserController.addFavoredCourse);
userRouter.delete('/me/favorites', authenticate, UserController.deleteFavoredCourse);

userRouter.delete('/me/schedule', authenticate, UserController.deleteCourseFromSchedule);
userRouter.post('/me/schedule/bulk', authenticate, UserController.addCoursesToSchedule);

export { userRouter };

