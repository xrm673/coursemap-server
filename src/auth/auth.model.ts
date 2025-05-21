// src/auth/auth.model.ts
// Authentication data structures and Firebase interactions

import { db } from '../../db/firebase-admin';
import { User } from '../user/user.model';

const usersCollection = db.collection('users');

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role?: 'student' | 'admin';
  year: number;
  college: string;
  majors: Array<{
    id: string;
    name: string;
    college: string;
    concentrations: Array<string>;
  }>;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

// Firebase interactions
export const createUser = async (userData: User): Promise<User> => {
  const docRef = await usersCollection.add(userData);
  return { ...userData, uid: docRef.id };
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() } as User;
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  await usersCollection.doc(userId).update({
    lastLogin: new Date()
  });
}; 