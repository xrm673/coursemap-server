import { Schema, model } from 'mongoose';
import { CollegeInMajor, Major, RawBasicSection, RawConcentration, RawEndSection } from './major.model';

const CollegeInMajorSchema = new Schema<CollegeInMajor>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const RawBasicSectionSchema = new Schema<RawBasicSection>({
  year: String,
  collegeId: String,
  requirementIds: { type: [String], required: true }
}, { _id: false });

const RawConcentrationSchema = new Schema<RawConcentration>({
  concentrationName: { type: String, required: true },
  requirementIds: { type: [String], required: true }
}, { _id: false });

const RawEndSectionSchema = new Schema<RawEndSection>({
  year: String,
  collegeId: String,
  requirementIds: { type: [String], required: true }
}, { _id: false });

const MajorSchema = new Schema<Major>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  needsYear: { type: Boolean, required: true },
  needsCollege: { type: Boolean, required: true },
  colleges: [CollegeInMajorSchema],
  numberOfRequiredCourses: Number,
  rawBasicSections: [RawBasicSectionSchema],
  rawConcentrations: [RawConcentrationSchema],
  rawEndSections: [RawEndSectionSchema],
  onboardingCourses: [String]
});

// Create indexes for common queries
MajorSchema.index({ name: 1 });
MajorSchema.index({ "colleges.id": 1 });

export const MajorModel = model<Major>('Major', MajorSchema, 'majors'); 