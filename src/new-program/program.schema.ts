import { Schema, model } from 'mongoose';
import { ProgramData } from './model/program.model';

const CollegeInProgramSchema = new Schema({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const MajorInCollegeSchema = new Schema({
  majorId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const RequirementSetSchema = new Schema({
  appliesTo: {
    entryYear: String,
    collegeId: String,
    majorId: String,
    concentrationNames: [String]
  },
  requirementIds: { type: [String], required: true }
}, { _id: false });

const ProgramSchema = new Schema<ProgramData>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['major', 'minor', 'college'], required: true },
  description: String,
  yearDependent: { type: Boolean, required: true },
  majorDependent: { type: Boolean, required: true },
  collegeDependent: { type: Boolean, required: true },
  concentrationDependent: { type: Boolean, required: true },
  requirementSets: { type: [RequirementSetSchema], required: true },
  colleges: [CollegeInProgramSchema],
  majors: [MajorInCollegeSchema]
});

// Create indexes for common queries
ProgramSchema.index({ name: 1 });
ProgramSchema.index({ type: 1 });
ProgramSchema.index({ "colleges.collegeId": 1 });
ProgramSchema.index({ "majors.majorId": 1 });

export const ProgramTreeModel = model<ProgramData>('ProgramTree', ProgramSchema, 'programs_tree');
