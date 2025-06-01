import { Schema, model } from 'mongoose';
import { Major } from './major.model';

const CollegeSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
});

const BasicRequirementSchema = new Schema({
  year: String,
  college: String,
  requirements: { type: [String], required: true }
});

const ConcentrationSchema = new Schema({
  concentration: { type: String, required: true },
  requirements: { type: [String], required: true }
});

const EndRequirementSchema = new Schema({
  year: String,
  college: String,
  requirements: { type: [String], required: true }
});

const MajorSchema = new Schema<Major>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  needsYear: { type: Boolean, required: true },
  needsCollege: { type: Boolean, required: true },
  colleges: [CollegeSchema],
  requiredCourseNumber: Number,
  basicRequirements: [BasicRequirementSchema],
  concentrations: [ConcentrationSchema],
  endRequirements: [EndRequirementSchema],
  onboardingCourses: [String]
});

// Create indexes for common queries
MajorSchema.index({ name: 1 });
MajorSchema.index({ "colleges.id": 1 });

export const MajorModel = model<Major>('Major', MajorSchema, 'majors'); 