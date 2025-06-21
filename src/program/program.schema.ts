import { Schema, model } from 'mongoose';
import { CollegeInProgram, MajorInCollege, Program, RawMainReqSet, RawConcentration, RawEndReqSet } from './program.model';

const CollegeInProgramSchema = new Schema<CollegeInProgram>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const MajorInCollegeSchema = new Schema<MajorInCollege>({
    majorId: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

const RawMainReqSetSchema = new Schema<RawMainReqSet>({
  years: [String],
  collegeId: String,
  requirementIds: { type: [String], required: true }
}, { _id: false });

const RawConcentrationSchema = new Schema<RawConcentration>({
  concentrationName: { type: String, required: true },
  requirementIds: { type: [String], required: true }
}, { _id: false });

const RawEndReqSetSchema = new Schema<RawEndReqSet>({
  years: [String],
  collegeId: String,
  requirementIds: { type: [String], required: true }
}, { _id: false });

const ProgramSchema = new Schema<Program>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  yearDependent: { type: Boolean, required: true },
  majorDependent: { type: Boolean, required: true },
  collegeDependent: { type: Boolean, required: true },
  colleges: [CollegeInProgramSchema],
  majors: [MajorInCollegeSchema],
  totalCoursesRequired: Number,
  rawMainReqSets: [RawMainReqSetSchema],
  rawConcentrations: [RawConcentrationSchema],
  rawEndReqSets: [RawEndReqSetSchema],
  onboardingCourses: [String]
});

// Create indexes for common queries
ProgramSchema.index({ name: 1 });
ProgramSchema.index({ "colleges.collegeId": 1 });

export const ProgramModel = model<Program>('Program', ProgramSchema, 'programs'); 