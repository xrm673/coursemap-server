// src/course/model.ts
// Data structure and MongoDB interactions

import { Instructor } from '../instructor/instructor.model';
import { CourseModel } from './course.schema';

export interface Course {
  _id: string;
  sbj: string;
  nbr: string;
  lvl: number;
  smst: Array<string>; // semester offered
  ttl: string; // title (long)
  tts: string; // title (short)
  courseHasTopic?: boolean; // true if the course has topic
  dsrpn: string; // description
  otcm?: Array<string>; // outcomes of the course
  distr?: Array<string>; // distribution categories
  metadata: {
    when?: Array<string>; // when (semester category) the course is offered, not accurate
    breadth?: string; // breadth category
    attr?: Array<string>; // attributes
    fee?: string; // course fee
    satisfies?: string; // satisfies requirement
    subfield?: string;
    career?: string;
    acadgrp?: string;
  }
  eligibility: {
    cmts?: string; // comments
    rcmdReq?: string; //recommend Prerequisite or Corequisite requirement in text
    req?: string; // Prerequisite, Corequisite, or PreCoRequisite in text
    prereq?: Array<{
      courses: Array<string>;
    }>;
    coreq?: Array<{
      courses: Array<string>;
    }>;
    preco?: Array<{
      courses: Array<string>;
    }>;
    needNote?: boolean; // true if the course needs a note for prereq/coreq/preco
    lanreq?: string; // language requirement
    ovlpText?: string; // original text of overlap courses
    ovlp?: Array<string>; // overlap courses
    pmsn?: string; // enrollment permission requirement
  }
  enrollGroups : Array<EnrollGroup>
}

export interface EnrollGroup {
  // identifier of the enrollment group
  // 1. If any section of the enrollment group has a topic, 
  //    use that topic as the identifier
  // 2. If no topic exists, and there's a section with type "IND" (independent study), 
  //    use the first instructor's lastname as the identifier
  // 3. If neither of the above, use the first section's key 
  //    (e.g., "PRJ-601") as the identifier
  grpIdentifier: string;

  // true if the identifier is a topic
  hasTopic: boolean; 

  // topic of the enrollment group (if any)
  topic?: string; 

  // updated for early semesters
  // semesters the enrollment group with the same identifier is offered in
  grpSmst: Array<string>; 

  // credit options of the enrollment group (use the latest semester provided)
  credits: Array<number>;

  // grading basis (e.g., "GRD", "OPT")
  grading: string;

  // list of compoenents (sections) in the latest semester provided
  components: Array<string>;

  // list of optional components (sections) in the latest semester provided
  componentsOptional?: Array<string>;

  // overall rating from CU Review
  // add later
  // ov?: number; 

  // difficulty from CU Review
  // df?: number; 

  // updated for early semesters
  instructorHistory?: Array<{
    semester: string;
    instructors: Array<Instructor>;
  }>;

  // true if it has a section that is offered long time out of Ithaca
  locationConflicts?: boolean;

  // consent requirement of the first section 
  // ("I" for instructor or "D" for department)
  // we assume that groups requiring department consent are limited to the major's students only
  consent?: string;

  // group session (e.g., "1", "7W2")
  session?: string;

  // instruction mode of the first section; (not displayed if in-person)
  mode?: string; 

  // updated for early semesters
  // only for semesters in current year (max length 4)
  sections?: Array<Section>;

  // combined courses (groups)
  comb?: Array<{
    courseId: string; 
    // grpIdentifier: string; // TODO: can only be updated when the database is established
    type: string;
  }>;

  // enrollement limitation from notes
  limitation?: string;

  // majorOnly?: Array<string>; // only students in the majors can take this course (group)
  // majorNo?: Array<string>; // students in the majors cannot take this course (group)
  // collegeOnly?: Array<string>; // only students in the colleges can take this course (group)
  // collegeNo?: Array<string>; // students in the colleges cannot take this course (group)
  // graduateOnly?: boolean; // only graduate students can take this course (group)

  // prereq from notes
  grpprereq?: Array<{
    courses: Array<string>;
  }>;

  // coreq from notes
  grpcoreq?: Array<{
    courses: Array<string>;
  }>;

  // preco from notes
  grppreco?: Array<{
    courses: Array<string>;
  }>;

}

export interface Section {
  semester: string; //  must be in current year
  type: string; // "LEC", "LAB", "DIS", "IND", etc.
  nbr: string; // "001", "601", etc.
  meetings: Array<Meeting>;
  open?: string; // "C" for closed, "W" for waitlist
  mode?: string; // not displayed if in-person
  location?: string; // only displayed if it's not offered in Ithaca
}

export interface Meeting {
  stTm: string; // "01:25PM"
  edTm: string; // "02:40PM"
  stDt: string; // "08/25/2025"
  edDt: string; // "12/13/2025"
  pt: string; // "MW", "TH", etc.
  topic?: string; // topic of the meeting
}

export interface NoDataCourse {
  _id: string;
  sbj: string;
  nbr: string;
  ttl: string;
  noData: boolean;
}

export const findById = async (_id: string): Promise<Course | null> => {
  return await CourseModel.findOne({ _id }).lean();
};

export const findByIds = async (_ids: string[]): Promise<Course[]> => {
  return await CourseModel.find({ _id: { $in: _ids } }).lean();
};

export const searchCourses = async (
  query: string, 
  limit: number = 20, 
  skip: number = 0
): Promise<Course[]> => {
  return await CourseModel
    .find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .skip(skip)
    .lean();
};