// src/course/controller.ts
// Request handlers for courses

import { Request, Response } from 'express';
import * as CourseService from './course.service';

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await CourseService.getCourse(id);
    res.status(200).json(course);
  } catch (error) {
    console.error(`Error fetching course ${req.params.id}:`, error);
    res.status(404).json({ error: 'Course not found' });
  }
};

// Other controller methods...