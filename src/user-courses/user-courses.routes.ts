// src/user-courses/user-courses.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserCoursesController from './user-courses.controller';
import { authenticate } from '../utils/middleware/auth.middleware';

const userCoursesRouter = Router();

userCoursesRouter.get('/', authenticate, UserCoursesController.getCourses);
userCoursesRouter.post('/', authenticate, UserCoursesController.addCourse);
userCoursesRouter.put('/', authenticate, UserCoursesController.updateCourse);
userCoursesRouter.delete('/', authenticate, UserCoursesController.removeCourse);

export { userCoursesRouter };

