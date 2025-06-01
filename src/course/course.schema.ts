import { Schema, model } from 'mongoose';
import { Course } from './course.model';

const EnrollGroupSchema = new Schema({
  grpIdentifier: { type: String, required: true },
  hasTopic: { type: Boolean, required: true },
  grpSmst: [String],
  credits: [Number],
  grading: { type: String, required: true },
  components: [String],
  componentsOptional: [String],
  instructors: [{
    semester: String,
    netids: [String]
  }],
  locationConflicts: Boolean,
  consent: String,
  session: String,
  mode: String,
  sections: [{
    semester: String,
    type: String,
    nbr: String,
    meetings: [{
      no: Number,
      stTm: String,
      edTm: String,
      stDt: String,
      edDt: String,
      pt: String,
      topic: String
    }],
    open: String,
    mode: String,
    location: String
  }],
  comb: [{
    courseId: String,
    type: String
  }],
  limitation: String,
  grpprereq: [{
    courses: [String]
  }],
  grpcoreq: [{
    courses: [String]
  }],
  grppreco: [{
    courses: [String]
  }]
});

const CourseSchema = new Schema<Course>({
  _id: { type: String, required: true, unique: true },
  sbj: { type: String, required: true },
  nbr: { type: String, required: true },
  lvl: { type: Number, required: true },
  smst: [String],
  ttl: { type: String, required: true },
  tts: { type: String, required: true },
  grpIdentifier: String,
  dsrpn: { type: String, required: true },
  when: [String],
  breadth: String,
  distr: [String],
  attr: [String],
  fee: String,
  satisfies: String,
  otcm: [String],
  subfield: String,
  career: String,
  acadgrp: String,
  eligibility: {
    cmts: String,
    rcmdReq: String,
    req: String,
    prereq: [{
      courses: [String]
    }],
    coreq: [{
      courses: [String]
    }],
    preco: [{
      courses: [String]
    }],
    needNote: Boolean,
    lanreq: String,
    ovlpText: String,
    ovlp: [String],
    pmsn: String
  },
  enrollGroups: [EnrollGroupSchema]
});

// Create indexes for common queries
CourseSchema.index({ ttl: 1 });  // Regular index on title
CourseSchema.index({ "enrollGroups.grpIdentifier": 1 });  // Index on enrollment group identifiers

export const CourseModel = model<Course>('Course', CourseSchema); 