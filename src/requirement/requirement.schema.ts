import { Schema, model } from 'mongoose';
import { CourseGroup, CourseNote, Requirement } from './requirement.model';

const CourseGroupSchema = new Schema<CourseGroup>({
  _id: { type: Number, required: true, unique: true },
  topic: String,
  courseIds: { type: [String], required: true },
  notes: String
});

const CourseNoteSchema = new Schema<CourseNote>({
  courseId: { type: String, required: true },
  grpIdentifierArray: [String],
  noteForRequirement: String,
  recommendedByDepartment: Boolean
}, { _id: false });

const RequirementSchema = new Schema<Requirement>({
  _id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  programId: { type: String, required: true },
  year: String,
  collegeId: String,
  concentrationName: String,
  name: { type: String, required: true },
  descr: [String],
  numberOfRequiredCourses: Number,
  useCredit: Boolean,
  numberOfRequiredCredits: Number,
  courseIds: [String],
  courseNotes: [CourseNoteSchema],
  courseGrps: [CourseGroupSchema],
  overlap: [String]
});

// Create indexes for common queries
RequirementSchema.index({ major: 1 });
RequirementSchema.index({ type: 1 });

export const RequirementModel = model<Requirement>('Requirement', RequirementSchema, 'requirements'); 