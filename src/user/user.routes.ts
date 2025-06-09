// src/user/user.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserController from './user.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getUser);
userRouter.put('/me', authenticate, UserController.updateUser);
userRouter.patch('/me', authenticate, UserController.partialUpdateUser);
userRouter.get('/me/favorites', authenticate, UserController.getFavoredCourses);
userRouter.post('/me/favorites', authenticate, UserController.addFavoredCourse);
userRouter.delete('/me/favorites', authenticate, UserController.deleteFavoredCourse);
userRouter.post('/me/schedule', authenticate, UserController.addCourseToSchedule);
userRouter.delete('/me/schedule', authenticate, UserController.deleteCourseFromSchedule);

export { userRouter };

