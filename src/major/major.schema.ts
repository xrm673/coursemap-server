import { Schema, model } from 'mongoose';
import { CollegeInMajor, Concentration, Major, RawBasicRequirement, RawEndRequirement } from './major.model';

const CollegeInMajorSchema = new Schema<CollegeInMajor>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const RawBasicRequirementSchema = new Schema<RawBasicRequirement>({
  year: String,
  collegeId: String,
  requirements: { type: [String], required: true }
}, { _id: false });

const ConcentrationSchema = new Schema<Concentration>({
  concentrationName: { type: String, required: true },
  requirements: { type: [String], required: true }
}, { _id: false });

const RawEndRequirementSchema = new Schema<RawEndRequirement>({
  year: String,
  collegeId: String,
  requirements: { type: [String], required: true }
}, { _id: false });

const MajorSchema = new Schema<Major>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  needsYear: { type: Boolean, required: true },
  needsCollege: { type: Boolean, required: true },
  colleges: [CollegeInMajorSchema],
  numberOfRequiredCourses: Number,
  rawBasicRequirements: [RawBasicRequirementSchema],
  concentrations: [ConcentrationSchema],
  rawEndRequirements: [RawEndRequirementSchema],
  onboardingCourses: [String]
});

// Create indexes for common queries
MajorSchema.index({ name: 1 });
MajorSchema.index({ "colleges.id": 1 });

export const MajorModel = model<Major>('Major', MajorSchema, 'majors'); 