import { Schema, model } from 'mongoose';
import { CourseGroup, CourseWithGrpTopic, Requirement } from './requirement.model';

const CourseGroupSchema = new Schema<CourseGroup>({
  topic: String,
  courseIds: { type: [String], required: true },
  notes: String
}, { _id: false });

const CourseWithGrpTopicSchema = new Schema<CourseWithGrpTopic>({
  courseId: { type: String, required: true },
  grpIdentifier: { type: String, required: true }
}, { _id: false });

const RequirementSchema = new Schema<Requirement>({
  _id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  major: { type: String, required: true },
  name: { type: String, required: true },
  tag: { type: String, required: true },
  tagDescr: { type: String, required: true },
  descr: [String],
  number: Number,
  courseIds: [String],
  courseWithGrpTopics: [CourseWithGrpTopicSchema],
  courseGrps: [CourseGroupSchema],
  overlap: [String]
});

// Create indexes for common queries
RequirementSchema.index({ major: 1 });
RequirementSchema.index({ type: 1 });

export const RequirementModel = model<Requirement>('Requirement', RequirementSchema, 'requirements'); 