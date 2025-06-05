import { Schema, model } from 'mongoose';
import { Course, EnrollGroup, Meeting, Section } from './course.model';
import { InstructorSchema } from '../instructor/instructor.schema';

const MeetingSchema = new Schema<Meeting>({
    stTm: String,
    edTm: String,
    stDt: String,
    edDt: String,
    pt: String,
    topic: String
  }, { _id: false });

const SectionSchema = new Schema<Section>({
    semester: String,
    type: String,
    nbr: String,
    meetings: [MeetingSchema],
    open: String,
    mode: String,
    location: String
}, { _id: false });

const EnrollGroupSchema = new Schema<EnrollGroup>({
  grpIdentifier: { type: String, required: true },
  hasTopic: { type: Boolean, required: true },
  topic: String,
  grpSmst: [String],
  credits: [Number],
  grading: { type: String, required: true },
  components: [String],
  componentsOptional: [String],
  instructorHistory: [{
    semester: String,
    instructors: [InstructorSchema]
  }],
  locationConflicts: Boolean,
  consent: String,
  session: String,
  mode: String,
  sections: [SectionSchema],
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
}, { _id: false });

const CourseSchema = new Schema<Course>({
  _id: { type: String, required: true, unique: true },
  sbj: { type: String, required: true },
  nbr: { type: String, required: true },
  lvl: { type: Number, required: true },
  smst: { type: [String], required: true },
  ttl: { type: String, required: true },
  tts: { type: String, required: true },
  dsrpn: { type: String, required: true },
  otcm: [String],
  distr: [String],
  metadata: {
    when: [String],
    breadth: String,
    attr: [String],
    fee: String,
    satisfies: String,
    subfield: String,
    career: String,
    acadgrp: String,
  },
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

export const CourseModel = model<Course>('Course', CourseSchema, 'courses'); 