import { Schema, model } from 'mongoose';
import { Requirement } from './requirement.model';

const CourseGroupSchema = new Schema({
  _id: { type: Number, required: true },
  topic: String,
  courses: [String],
  notes: String
});

const RequirementSchema = new Schema<Requirement>({
  _id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  major: { type: String, required: true },
  name: { type: String, required: true },
  tag: { type: String, required: true },
  tagDescr: { type: String, required: true },
  descr: [String],
  number: Number,
  courses: [{
    type: Schema.Types.Mixed,
    validate: {
      validator: function(v: any) {
        return typeof v === 'string' || (typeof v === 'object' && v.id && v.grpIdentifier);
      },
      message: 'Course must be either a string ID or an object with id and grpIdentifier'
    }
  }],
  courseGrps: [CourseGroupSchema],
  overlap: [String]
});

// Create indexes for common queries
RequirementSchema.index({ major: 1 });
RequirementSchema.index({ type: 1 });

export const RequirementModel = model<Requirement>('Requirement', RequirementSchema); 