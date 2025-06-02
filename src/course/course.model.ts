// src/course/model.ts
// Data structure and MongoDB interactions

import { CourseModel } from './course.schema';

export interface Course {
  _id: string;
  sbj: string;
  nbr: string;
  lvl: number;
  smst: Array<string>; // semester offered
  ttl: string; // title (long)
  tts: string; // title (short)
  grpIdentifier?: string; // only specified when the course has topic and has one enrol group
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
  instructors?: Array<{
    semester: string;
    netids: Array<string>;
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

export interface CourseFavored {
  _id: string;
  grpIdentifier?: string;
}

export interface CourseInSchedule {
  _id: string;
  grpIdentifier?: string; // must be specified if course has topic
  usedInRequirements: Array<string>; // list of requirements that use this course
  credit: number; // the credits gained (would gain) from this course
  semester: string; // the semester that the course is planned or taken in
  sections?: Array<string>; // list of sections (e.g., "LEC-001", "DIS-601", etc.)
  // qualified: boolean; // true if the course is qualified to take in the planned semester
  // repeatWarning: boolean; // true if the course has been planned or taken in other semesters
}

export interface FetchedCourseInSchedule extends Course{
  usedInRequirements: Array<string>; // Schedule field: list of requirements that use this course
  credit: number; // Schedule field: the credits gained (would gain) from this course
  semester: string; // Schedule field: the semester that the course is planned or taken in
  sections?: Array<string>; // Schedule field: list of sections (e.g., "LEC-001", "DIS-601", etc.)
}

export interface CourseInScheduleForRequirement extends CourseInSchedule {
  sbj: string; // Schedule field: subject
  nbr: string; // Schedule field: number
  tts: string; // Schedule field: title (short)
}

export const findById = async (_id: string): Promise<Course | null> => {
  return await CourseModel.findOne({ _id });
};

export const findByIds = async (_ids: string[]): Promise<Course[]> => {
  return await CourseModel.find({ _id: { $in: _ids } });
};

/*
 * Convert a CourseInSchedule to a FetchedCourseInSchedule by fetching the course data
 * and merging it with the schedule data
 */
export const fetchCourseInSchedule = async (courseInSchedule: CourseInSchedule): Promise<FetchedCourseInSchedule | null> => {
  const course = await findById(courseInSchedule._id);
  if (!course) return null;

  // If the course has a grpIdentifier, ensure we're using the correct enrollment group
  let enrollGroup = undefined;
  if (courseInSchedule.grpIdentifier) {
    enrollGroup = course.enrollGroups.find(group => group.grpIdentifier === courseInSchedule.grpIdentifier);
    if (!enrollGroup) return null;
  }

  // Merge the course data with the schedule data
  return {
    ...course,
    usedInRequirements: courseInSchedule.usedInRequirements,
    credit: courseInSchedule.credit,
    semester: courseInSchedule.semester,
    sections: courseInSchedule.sections
  };
};

/*
 * Convert an array of CourseInSchedule to FetchedCourseInSchedule
 */
export const fetchCoursesInSchedule = async (coursesInSchedule: CourseInSchedule[]): Promise<FetchedCourseInSchedule[]> => {
  const fetchedCourses = await Promise.all(
    coursesInSchedule.map(course => fetchCourseInSchedule(course))
  );
  return fetchedCourses.filter((course): course is FetchedCourseInSchedule => course !== null);
};