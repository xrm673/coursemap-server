// src/requirement/requirement.service.ts
// Business logic for requirements

import * as RequirementModel from './requirement.model';
import { Requirement, ProcessedRequirement, ProcessedCourseGroup } from './requirement.model';
import { CourseInSchedule } from '../course/course.model';
import { isTaken } from '../course/course.service';


export const getRequirement = async (
    id: string
): Promise<Requirement> => {
    const requirement = await RequirementModel.findById(id);
    if (!requirement) {
        throw new Error('Requirement not found');
    }
    return requirement;
};


/**
 * Processes requirements and their relationship with user's courses.
 * For each requirement, it checks which courses are taken/planned and updates completion status.
 * Also tracks which requirements each course is used for to handle overlaps.
 */
export const processRequirements = async (
    requirementIds: string[],
    userCourses?: CourseInSchedule[]
): Promise<{
    requirements: ProcessedRequirement[],
    userCourses: CourseInSchedule[]
}> => {
    const processedRequirements: ProcessedRequirement[] = [];
    let updatedUserCourses = userCourses || [];

    // Fetch all requirements in one query
    const requirements = await RequirementModel.findByIds(requirementIds);

    for (const reqDetails of requirements) {
        // If no userCourses, create basic processed requirement
        if (!userCourses) {
            processedRequirements.push({
                _id: reqDetails._id,
                type: reqDetails.type,
                majorId: reqDetails.majorId,
                name: reqDetails.name,
                descr: reqDetails.descr,
                numberOfRequiredCourses: reqDetails.numberOfRequiredCourses,
                courseIds: reqDetails.courseIds,
                courseNotes: reqDetails.courseNotes,
                courseGrps: reqDetails.courseGrps?.map(grp => ({
                    ...grp,
                    completed: false
                })),
                overlap: reqDetails.overlap,
                completed: false,
                taken: [],
                planned: [],
                takenNotUsed: [],
                plannedNotUsed: [],
            });
            continue;
        }

        // Process based on requirement type
        if (reqDetails.type === "E") {
            const { processedRequirement, userCourses: newUserCourses } = await processElective(reqDetails, updatedUserCourses);
            processedRequirements.push(processedRequirement);
            updatedUserCourses = newUserCourses;
        } else if (reqDetails.type === "C") {
            const { processedRequirement, userCourses: newUserCourses } = await processCore(reqDetails, updatedUserCourses);
            processedRequirements.push(processedRequirement);
            updatedUserCourses = newUserCourses;
        }
    }

    return {
        requirements: processedRequirements,
        userCourses: updatedUserCourses
    };
};


/*
    Process an elective requirement
*/
export const processElective = async (
    reqDetails: Requirement,
    userCourses: CourseInSchedule[],
): Promise<{
    processedRequirement: ProcessedRequirement,
    userCourses: CourseInSchedule[],
}> => {
    const processedRequirement: ProcessedRequirement = {
        _id: reqDetails._id,
        type: reqDetails.type,
        majorId: reqDetails.majorId,
        name: reqDetails.name,
        descr: reqDetails.descr,
        numberOfRequiredCourses: reqDetails.numberOfRequiredCourses,
        courseIds: reqDetails.courseIds,
        courseNotes: reqDetails.courseNotes,
        overlap: reqDetails.overlap,
        completed: false,
        taken: [],
        planned: [],
        takenNotUsed: [],
        plannedNotUsed: [],
    };

    const updatedUserCourses = [...userCourses];
    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const takenNotUsed: CourseInSchedule[] = [];
    const plannedNotUsed: CourseInSchedule[] = [];

    if (!reqDetails.courseIds) {
        return { processedRequirement, userCourses: updatedUserCourses };
    }

    // Find all matching courses in the user's schedule
    const matchingUserCourses = updatedUserCourses.filter(userCourse => 
        isMatchingCourse(reqDetails, userCourse)
    );
    let completed = false;
    let completedCount = 0;

    // Process the matching courses
    for (const matchingCourse of matchingUserCourses) {
        if (matchingCourse.usedInRequirements.includes(reqDetails._id)) {
            // Course already used in this requirement
            if (isTaken(matchingCourse)) {
                taken.push(matchingCourse);
            } else {
                planned.push(matchingCourse);
            }
            ({ completed, completedCount } = checkRequirementCompletion(reqDetails, matchingCourse, completedCount));
        } else if (reqDetails.overlap?.some(reqId => 
            matchingCourse.usedInRequirements.includes(reqId)
        )) {
            if (isTaken(matchingCourse)) {
                takenNotUsed.push(matchingCourse);
            } else {
                plannedNotUsed.push(matchingCourse);
            }
        } else if (!completed) {
            // If requirement isn't completed and course isn't used in overlapping requirements
            matchingCourse.usedInRequirements.push(reqDetails._id);
            if (isTaken(matchingCourse)) {
                taken.push(matchingCourse);
            } else {
                planned.push(matchingCourse);
            }
            ({ completed, completedCount } = checkRequirementCompletion(reqDetails, matchingCourse, completedCount));
        } else {
            // If requirement is completed, any additional matching courses go to notUsed
            if (isTaken(matchingCourse)) {
                takenNotUsed.push(matchingCourse);
            } else {
                plannedNotUsed.push(matchingCourse);
            }
        }
    }

    processedRequirement.taken = taken;
    processedRequirement.planned = planned;
    processedRequirement.takenNotUsed = takenNotUsed;
    processedRequirement.plannedNotUsed = plannedNotUsed;

    processedRequirement.completed = 
        processedRequirement.taken.length >= (reqDetails.numberOfRequiredCourses || 0);

    return { processedRequirement, userCourses: updatedUserCourses };
};


/*
    Process a core requirement
*/
export const processCore = async (
    reqDetails: Requirement,
    userCourses: CourseInSchedule[]
): Promise<{
    processedRequirement: ProcessedRequirement,
    userCourses: CourseInSchedule[]
}> => {
    const processedRequirement: ProcessedRequirement = {
        _id: reqDetails._id,
        type: reqDetails.type,
        majorId: reqDetails.majorId,
        name: reqDetails.name,
        descr: reqDetails.descr,
        numberOfRequiredCourses: reqDetails.numberOfRequiredCourses,
        courseIds: reqDetails.courseIds,
        courseNotes: reqDetails.courseNotes,
        courseGrps: [] as ProcessedCourseGroup[], // Initialize as empty array with type assertion
        overlap: reqDetails.overlap,
        completed: false,
        taken: [],
        planned: [],
        takenNotUsed: [],
        plannedNotUsed: [],
    };

    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const takenNotUsed: CourseInSchedule[] = [];
    const plannedNotUsed: CourseInSchedule[] = [];

    if (!reqDetails.courseGrps) {
        return { processedRequirement, userCourses };
    }

    for (const group of reqDetails.courseGrps) {
        let takenOrPlanned = false;
        let completed = false;
        for (const courseId of group.courseIds) {
            const matchingUserCourse = userCourses.find(uc => 
                uc._id === courseId
            );

            if (!matchingUserCourse) continue;

            if (matchingUserCourse.usedInRequirements.includes(reqDetails._id)) {
                takenOrPlanned = true;
                if (isTaken(matchingUserCourse)) {
                    completed = true;
                    taken.push(matchingUserCourse);
                } else {
                    planned.push(matchingUserCourse);
                }
            } else if (reqDetails.overlap?.some(_id => 
                matchingUserCourse.usedInRequirements.includes(_id)
            )) {
                if (isTaken(matchingUserCourse)) {
                    takenNotUsed.push(matchingUserCourse);
                } else {
                    plannedNotUsed.push(matchingUserCourse);
                }
            } else if (!takenOrPlanned) {
                takenOrPlanned = true;
                matchingUserCourse.usedInRequirements.push(reqDetails._id);
                if (isTaken(matchingUserCourse)) {
                    completed = true;
                    taken.push(matchingUserCourse);
                } else {
                    planned.push(matchingUserCourse);
                }
            } else {
                if (isTaken(matchingUserCourse)) {
                    takenNotUsed.push(matchingUserCourse);
                } else {
                    plannedNotUsed.push(matchingUserCourse);
                }
            }
        }
        processedRequirement.courseGrps?.push({
            ...group,
            completed
        });
    }

    // Fetch full course data for all courses
    processedRequirement.taken = taken;
    processedRequirement.planned = planned;
    processedRequirement.takenNotUsed = takenNotUsed;
    processedRequirement.plannedNotUsed = plannedNotUsed;

    processedRequirement.completed = 
        processedRequirement.taken.length >= (reqDetails.numberOfRequiredCourses || 0);

    return { processedRequirement, userCourses };
};

function isMatchingCourse(reqDetails: Requirement, userCourse: CourseInSchedule): boolean {
    // First check if the course ID matches any in courseIds
    if (reqDetails.courseIds && reqDetails.courseIds.includes(userCourse._id)) {
        // If the userCourse doesn't have a grpIdentifier, it's a match
        if (!userCourse.grpIdentifier) {
            return true;
        } else {
            if (reqDetails.courseNotes) {
                const courseNote = reqDetails.courseNotes.find(courseNote => 
                    courseNote.courseId === userCourse._id
                )
                if (courseNote && courseNote.grpIdentifierArray) {
                    return courseNote.grpIdentifierArray.includes(userCourse.grpIdentifier);
                } 
            }
            return true;
        }
    }
    return false;
}

function checkRequirementCompletion(
    reqDetails: Requirement, matchingCourse: CourseInSchedule, completedCount: number
): { completed: boolean, completedCount: number } {
    // If requirement isn't completed and course isn't used in overlapping requirements
    if (reqDetails.numberOfRequiredCourses) {
        completedCount++;
    } else if (reqDetails.numberOfRequiredCredits) {
        completedCount += matchingCourse.credit;
    }
    const completed = completedCount >= (reqDetails.numberOfRequiredCourses ?? reqDetails.numberOfRequiredCredits ?? 0);
    return { completed, completedCount };
}