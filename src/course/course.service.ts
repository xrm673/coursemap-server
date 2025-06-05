// src/course/service.ts
// Business logic for courses

import { plannedSemesters, takenSemesters } from '../utils/constants';
import * as CourseModel from './course.model';
import { Course, NoDataCourse, CourseInSchedule } from './course.model';


export const getCourse = async (courseId: string, ttl?: string): Promise<Course | NoDataCourse> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    // Extract the subject (letters) from the courseId
    const subject = courseId.match(/^[A-Za-z]+/)?.[0] || '';
    return {
      _id: courseId,
      sbj: subject,
      nbr: courseId.slice(subject.length), // Get the number part
      ttl: ttl || 'No data', // Include ttl if provided
      noData: true,
    };
  }
  return course;
};

export const getCoursesByIds = async (courseIds: string[]): Promise<Course[]> => {
  const courses = await CourseModel.findByIds(courseIds);
  return courses;
};

export const isTaken = (course: CourseInSchedule): boolean => {
  return takenSemesters.includes(course.semester);
};

export const isPlanned = (course: CourseInSchedule): boolean => {
  return plannedSemesters.includes(course.semester);
};