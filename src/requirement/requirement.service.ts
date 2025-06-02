// src/requirement/requirement.service.ts
// Business logic for requirements

import * as RequirementModel from './requirement.model';
import { Requirement, ProcessedRequirement } from './requirement.model';
import { CourseInSchedule, fetchCoursesInSchedule } from '../course/course.model';
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
                major: reqDetails.major,
                name: reqDetails.name,
                tag: reqDetails.tag,
                tagDescr: reqDetails.tagDescr,
                descr: reqDetails.descr,
                number: reqDetails.number,
                courseIds: reqDetails.courseIds,
                courseWithGrpTopics: reqDetails.courseWithGrpTopics,
                courseGrps: reqDetails.courseGrps,
                overlap: reqDetails.overlap,
                completed: false,
                takenCourses: [],
                plannedCourses: [],
                eligibleButNotUsedCourses: [],
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
        major: reqDetails.major,
        name: reqDetails.name,
        tag: reqDetails.tag,
        tagDescr: reqDetails.tagDescr,
        descr: reqDetails.descr,
        number: reqDetails.number,
        courseIds: reqDetails.courseIds,
        courseWithGrpTopics: reqDetails.courseWithGrpTopics,
        courseGrps: reqDetails.courseGrps,
        overlap: reqDetails.overlap,
        completed: false,
        takenCourses: [],
        plannedCourses: [],
        eligibleButNotUsedCourses: []
    };

    const updatedUserCourses = [...userCourses];
    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const eligible: CourseInSchedule[] = [];

    if (!reqDetails.courseIds) {
        return { processedRequirement, userCourses: updatedUserCourses };
    }

    // Find all matching courses in the user's schedule
    const matchingUserCourses = updatedUserCourses.filter(userCourse => 
        isMatchingCourse(reqDetails, userCourse)
    );

    // Process the matching courses
    for (const matchingCourse of matchingUserCourses) {
        if (matchingCourse.usedInRequirements.includes(reqDetails._id)) {
            // Course already used in this requirement
            if (isTaken(matchingCourse)) {
                taken.push(matchingCourse);
            } else {
                planned.push(matchingCourse);
            }
        } else if (reqDetails.overlap?.some(reqId => 
            matchingCourse.usedInRequirements.includes(reqId)
        )) {
            // Course used in an overlapping requirement
            eligible.push(matchingCourse);
        } else {
            // Course not used yet
            matchingCourse.usedInRequirements.push(reqDetails._id);
            if (isTaken(matchingCourse)) {
                taken.push(matchingCourse);
            } else {
                planned.push(matchingCourse);
            }
        }
    }

    // Fetch full course data for all courses
    processedRequirement.takenCourses = await fetchCoursesInSchedule(taken);
    processedRequirement.plannedCourses = await fetchCoursesInSchedule(planned);
    processedRequirement.eligibleButNotUsedCourses = await fetchCoursesInSchedule(eligible);

    processedRequirement.completed = 
        processedRequirement.takenCourses.length >= (reqDetails.number || 0);

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
        major: reqDetails.major,
        name: reqDetails.name,
        tag: reqDetails.tag,
        tagDescr: reqDetails.tagDescr,
        descr: reqDetails.descr,
        number: reqDetails.number,
        courseIds: reqDetails.courseIds,
        courseWithGrpTopics: reqDetails.courseWithGrpTopics,
        courseGrps: reqDetails.courseGrps,
        overlap: reqDetails.overlap,
        completed: false,
        takenCourses: [],
        plannedCourses: [],
        eligibleButNotUsedCourses: []
    };

    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const eligible: CourseInSchedule[] = [];

    if (!reqDetails.courseGrps) {
        return { processedRequirement, userCourses };
    }

    for (const group of reqDetails.courseGrps) {
        for (const courseId of group.courseIds) {
            const matchingUserCourse = userCourses.find(uc => 
                uc._id === courseId
            );

            if (!matchingUserCourse) continue;

            let completed = false;

            if (matchingUserCourse.usedInRequirements.includes(reqDetails._id)) {
                if (isTaken(matchingUserCourse)) {
                    taken.push(matchingUserCourse);
                } else {
                    planned.push(matchingUserCourse);
                }
                completed = true;
            } else if (reqDetails.overlap?.some(_id => 
                matchingUserCourse.usedInRequirements.includes(_id)
            )) {
                eligible.push(matchingUserCourse);
            } else if (!completed) {
                matchingUserCourse.usedInRequirements.push(reqDetails._id);
                if (isTaken(matchingUserCourse)) {
                    taken.push(matchingUserCourse);
                } else {
                    planned.push(matchingUserCourse);
                }
                completed = true;
            } else {
                eligible.push(matchingUserCourse);
            }
        }
    }

    // Fetch full course data for all courses
    processedRequirement.takenCourses = await fetchCoursesInSchedule(taken);
    processedRequirement.plannedCourses = await fetchCoursesInSchedule(planned);
    processedRequirement.eligibleButNotUsedCourses = await fetchCoursesInSchedule(eligible);

    processedRequirement.completed = 
        processedRequirement.takenCourses.length >= (reqDetails.number || 0);

    return { processedRequirement, userCourses };
};

function isMatchingCourse(reqDetails: Requirement, userCourse: CourseInSchedule): boolean {
    // First check if the course ID matches any in courseIds
    if (reqDetails.courseIds && reqDetails.courseIds.includes(userCourse._id)) {
        // If the userCourse doesn't have a grpIdentifier, it's a match
        if (!userCourse.grpIdentifier) {
            return true;
        }
    }

    // Then check if it matches any course in courseWithGrpTopic
    if (reqDetails.courseWithGrpTopics) {
        const matchingCourseWithGrp = reqDetails.courseWithGrpTopics.find(course => 
            course.courseId === userCourse._id && 
            course.grpIdentifier === userCourse.grpIdentifier
        );
        if (matchingCourseWithGrp) {
            return true;
        }
    }

    // If no matches found, return false
    return false;
}