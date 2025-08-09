// src/user-courses/user-courses.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserCoursesController from './user-courses.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userCoursesRouter = Router();

userCoursesRouter.get('/', authenticate, UserCoursesController.getCourses);
userCoursesRouter.post('/', authenticate, UserCoursesController.addCourses);
userCoursesRouter.delete('/', authenticate, UserCoursesController.removeCourses);

export { userCoursesRouter };

