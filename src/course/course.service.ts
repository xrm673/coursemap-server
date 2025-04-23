// src/course/service.ts
// Business logic for courses

import * as CourseModel from './course.model';
import { Course, NoDataCourse } from './course.model';


export const getCourse = async (courseId: string): Promise<Course | NoDataCourse> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return {courseId: courseId};
  }
  return course;
};