// src/user/user.routes.ts
// Routes for users

import { Router } from 'express';
import * as UserController from './user.controller';

const userRouter = Router();

userRouter.get('/:netid', UserController.getUser);

export { userRouter };

