// src/course/controller.ts
// Request handlers for courses

import { Request, Response } from 'express';
import * as CourseService from './course.service';

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ttl } = req.query;
    const course = await CourseService.getCourse(id, ttl as string | undefined);
    res.status(200).json(course);
  } catch (error) {
    console.error(`Error fetching course ${req.params.id}:`, error);
    res.status(404).json({ error: 'Course not found' });
  }
};

export const getCoursesByIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseIds } = req.body;
    if (!courseIds || !Array.isArray(courseIds) || courseIds.some(id => typeof id !== 'string')) {
      res.status(400).json({ error: "Invalid input: 'ids' must be an array of strings." });
      return;
    }
    const courses = await CourseService.getCoursesByIds(courseIds as string[]);
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses by IDs:', error);
    res.status(500).json({ error: 'Internal server error while fetching courses' });
  }
};

export const getCoursesWithInstructorsByIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseIds } = req.body;
    const courses = await CourseService.getCoursesWithInstructorsByIds(courseIds as string[]);
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses with instructors by IDs:', error);
    res.status(500).json({ error: 'Internal server error while fetching courses with instructors' });
  }
};