// src/course/service.ts
// Business logic for courses

import { plannedSemesters, takenSemesters } from '../utils/constants';
import * as CourseModel from './course.model';
import { Course, NoDataCourse, CourseInSchedule } from './course.model';


export const getCourse = async (courseId: string): Promise<Course | NoDataCourse> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return {courseId: courseId};
  }
  return course;
};

export const isTaken = (course: CourseInSchedule): boolean => {
  return takenSemesters.includes(course.semester);
};

export const isPlanned = (course: CourseInSchedule): boolean => {
  return plannedSemesters.includes(course.semester);
};