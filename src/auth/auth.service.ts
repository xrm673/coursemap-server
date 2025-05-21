// src/auth/auth.service.ts
// Authentication business logic and JWT handling

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../user/user.model';
import { LoginCredentials, SignupData, AuthResponse } from './auth.model';
import * as AuthModel from './auth.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const generateToken = (user: User): string => {
  if (!user.role) {
    throw new AuthError('User role is required for token generation');
  }

  const payload = {
    userId: user.uid,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signup = async (signupData: SignupData): Promise<AuthResponse> => {
  // Check if user already exists
  const existingUser = await AuthModel.findUserByEmail(signupData.email);
  if (existingUser) {
    throw new AuthError('User with this email already exists');
  }

  // Create new user
  const passwordHash = await hashPassword(signupData.password);
  const newUser: User = {
    email: signupData.email,
    firstName: signupData.firstName,
    lastName: signupData.lastName,
    passwordHash,
    netid: signupData.netid,
    role: signupData.role || 'student',
    year: signupData.year,
    college: signupData.college,
    majors: signupData.majors
  };

  const createdUser = await AuthModel.createUser(newUser);
  const token = generateToken(createdUser);

  // Return user data without password hash
  const { passwordHash: _, ...userWithoutPassword } = createdUser;
  return {
    token,
    user: userWithoutPassword
  };
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const user = await AuthModel.findUserByEmail(credentials.email);
  if (!user || !user.passwordHash) {
    throw new AuthError('Invalid email or password');
  }

  const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthError('Invalid email or password');
  }

  // Update last login
  if (!user.uid) {
    throw new AuthError('User ID is missing');
  }
  await AuthModel.updateUserLastLogin(user.uid);

  const token = generateToken(user);
  
  // Return user data without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    token,
    user: userWithoutPassword
  };
}; 