// src/auth/auth.controller.ts
// Authentication request handlers

import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { SignupData, LoginCredentials } from './auth.model';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const signupData: SignupData = req.body;
    const result = await AuthService.signup(signupData);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthService.AuthError) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials: LoginCredentials = req.body;
    const result = await AuthService.login(credentials);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthService.AuthError) {
      res.status(401).json({ error: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 