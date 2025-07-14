// src/auth/auth.types.ts
// Authentication type definitions

import { User, UserMinor } from '../user/user.model';
import { UserMajor, UserCollege } from '../user/user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  firstName: string;
  lastName: string;
  netid: string;
  role?: 'student' | 'admin';
  year: string;
  semesters: string[];
  college: UserCollege;
  majors: UserMajor[];
  minors?: Array<UserMinor>;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
} 