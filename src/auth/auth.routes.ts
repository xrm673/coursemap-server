// src/auth/auth.routes.ts
// Authentication route definitions

import express from 'express';
import { signup, login } from './auth.controller';

const authRouter = express.Router();

// Public routes
authRouter.post('/signup', signup);
authRouter.post('/login', login);

export { authRouter }; 