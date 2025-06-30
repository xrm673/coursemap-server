import { Schema, model } from 'mongoose';
import { CollegeInProgram, MajorInCollege, Program, RawReqSet, RawCategorySection, RawCategory } from './program.model';

const CollegeInProgramSchema = new Schema<CollegeInProgram>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const MajorInCollegeSchema = new Schema<MajorInCollege>({
    majorId: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

const RawCategorySchema = new Schema<RawCategory>({
    categoryName: String,
    categoryRequiredCoursesCount: Number,
    hasUpperLimit: Boolean,
    requirementIds: { type: [String], required: true }
  }, { _id: false });


const RawCategorySectionSchema = new Schema<RawCategorySection>({
    sectionRequiredCategoriesCount: Number,
    sectionRequiredCoursesCount: Number,
    isConcentration: Boolean,
    aggregateBySum: Boolean,
    categories: { type: [RawCategorySchema], required: true }
}, { _id: false });

const RawReqSetSchema = new Schema<RawReqSet>({
  years: [String],
  collegeIds: [String],
  rawReqList: { type: [Schema.Types.Mixed], required: true }
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
  concentrationNames: [String],
  rawReqSets: [RawReqSetSchema],
  onboardingCourses: [String]
});

// Create indexes for common queries
ProgramSchema.index({ name: 1 });
ProgramSchema.index({ "colleges.collegeId": 1 });

export const ProgramModel = model<Program>('Program', ProgramSchema, 'programs'); 