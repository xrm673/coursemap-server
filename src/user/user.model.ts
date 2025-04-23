// src/user/user.model.ts
// Data structure and Firebase interactions

import { db } from '../../db/firebase-admin';


export interface User {
    id?: string;
    email: string;
    name: string;
    majorId: string;
    year: number;
}

const usersCollection = db.collection('users');

/*
    Find a user by their NetID
*/
export const findById = async (netid: string): Promise<User | null> => {
    const doc = await usersCollection.doc(netid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
};

