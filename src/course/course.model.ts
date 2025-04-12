// src/course/model.ts
// Data structure and Firebase interactions

import { db } from '../../db/firebase-admin';

const coursesCollection = db.collection('courses');

// TODO
export interface Course {
  id?: string;
  title: string;
  description: string;
  instructorId: string;
  // other fields...
}


export const getCourseById = async (id: string): Promise<Course | null> => {
  const doc = await coursesCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Course;
};