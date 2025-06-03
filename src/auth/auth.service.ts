// src/auth/auth.service.ts
// Authentication business logic and JWT handling

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserModel } from '../user/user.schema';
import { User } from '../user/user.model';
import { LoginCredentials, SignupData, AuthResponse } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const generateToken = (user: User): string => {
  if (!user.role) throw new AuthError('User role is required for token generation');
  const payload = {
    _id: (user._id as Types.ObjectId).toString(),
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
  const existingUser = await UserModel.findOne({ email: signupData.email });
  if (existingUser) throw new AuthError('User with this email already exists');

  const passwordHash = await bcrypt.hash(signupData.password, SALT_ROUNDS);

  const user = new UserModel({
    ...signupData,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await user.save();
  const token = generateToken(user);

  // Remove passwordHash from returned user object
  const userObj = user.toObject();
  userObj.passwordHash = undefined;

  return { token, user: userObj };
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const user = await UserModel.findOne({ email });
  if (!user || !user.passwordHash) throw new AuthError('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AuthError('Invalid email or password');

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  // Remove passwordHash from returned user object
  const userObj = user.toObject();
  userObj.passwordHash = undefined;

  return { token, user: userObj };
}; 