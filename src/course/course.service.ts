// src/course/service.ts
// Business logic for courses

import * as CourseModel from './course.model';
import { Course } from './course.model';


export const getCourse = async (id: string): Promise<Course> => {
  const course = await CourseModel.getCourseById(id);
  if (!course) {
    throw new Error('Course not found');
  }
  return course;
};