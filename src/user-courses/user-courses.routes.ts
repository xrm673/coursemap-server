// src/user-courses/user-courses.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserCoursesController from './user-courses.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userCoursesRouter = Router();

userCoursesRouter.get('/my-courses', authenticate, UserCoursesController.getCourses);
userCoursesRouter.post('/my-courses', authenticate, UserCoursesController.addCourses);
userCoursesRouter.delete('/my-courses', authenticate, UserCoursesController.removeCourses);

export { userCoursesRouter };

