import { Schema, model } from 'mongoose';
import { RequirementData, NodeData } from './model/requirement.model';

const CourseNoteSchema = new Schema({
  courseId: { type: String, required: true },
  grpIdentifierArray: [String],
  noteForRequirement: String,
  recommendedByDepartment: Boolean
}, { _id: false });

const RuleSchema = new Schema({
  pick: { type: Number, required: true }
}, { _id: false });

const NodeDataSchema = new Schema<NodeData>({
  nodeId: { type: String, required: true },
  type: { type: String, enum: ['GROUP', 'COURSE_SET'], required: true },
  title: { type: String, required: true },
  rule: { type: RuleSchema, required: true },
  // Fields for GROUP type
  children: [String],
  // Fields for COURSE_SET type
  options: [String],
  courseNotes: [CourseNoteSchema]
}, { _id: false });

const RequirementSchema = new Schema<RequirementData>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: [String], required: true },
  uiType: { type: String, enum: ['LIST', 'GROUP', 'OPTION'], required: true },
  programId: { type: String, required: true },
  concentrationName: String,
  conflictsWith: { type: [String], required: true },
  rootNodeId: { type: String, required: true },
  nodesData: { type: [NodeDataSchema], required: true }
});

// Create indexes for common queries
RequirementSchema.index({ programId: 1 });
RequirementSchema.index({ uiType: 1 });
RequirementSchema.index({ concentrationName: 1 });

export const RequirementTreeModel = model<RequirementData>('RequirementTree', RequirementSchema, 'requirements_tree');
