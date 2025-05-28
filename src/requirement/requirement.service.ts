// src/requirement/requirement.service.ts
// Business logic for requirements

import * as RequirementModel from './requirement.model';
import { Requirement, ProcessedRequirement } from './requirement.model';
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

    for (const reqId of requirementIds) {
        const reqDetails = await getRequirement(reqId);
        if (!reqDetails) continue;

        // If no userCourses, create basic processed requirement
        if (!userCourses) {
            processedRequirements.push({
                ...reqDetails,
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
        ...reqDetails,
        completed: false,
        takenCourses: [],
        plannedCourses: [],
        eligibleButNotUsedCourses: []
    };

    const updatedUserCourses = [...userCourses];

    if (!reqDetails.courses) {
        return { processedRequirement, userCourses: updatedUserCourses };
    }

    for (const courseRef of reqDetails.courses) {
        // if courseRef is a string, it is a courseId; otherwise it is an object
        const courseId = typeof courseRef === 'string' ? courseRef : courseRef.id;
        const grpIdentifier = typeof courseRef === 'string' ? undefined : courseRef.grpIdentifier;

        const matchingUserCourse = updatedUserCourses.find(userCourse => 
            userCourse.id === courseId && 
            (!grpIdentifier || userCourse.grpIdentifier === grpIdentifier)
        );

        if (!matchingUserCourse) continue;

        if (matchingUserCourse.usedInRequirements.includes(reqDetails.id)) {
            if (isTaken(matchingUserCourse)) {
                processedRequirement.takenCourses.push(matchingUserCourse);
            } else {
                processedRequirement.plannedCourses.push(matchingUserCourse);
            }
        } else if (reqDetails.overlap?.some(reqid => 
            matchingUserCourse.usedInRequirements.includes(reqid)
        )) {
            processedRequirement.eligibleButNotUsedCourses.push(matchingUserCourse);
        } else if (!reqDetails.overlap?.some(id => 
            matchingUserCourse.usedInRequirements.includes(id)
        )) {
            matchingUserCourse.usedInRequirements.push(reqDetails.id);
            if (isTaken(matchingUserCourse)) {
                processedRequirement.takenCourses.push(matchingUserCourse);
            } else {
                processedRequirement.plannedCourses.push(matchingUserCourse);
            }
        }
    }

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
        ...reqDetails,
        completed: false,
        takenCourses: [],
        plannedCourses: [],
        eligibleButNotUsedCourses: []
    };

    if (!reqDetails.courseGrps) {
        return { processedRequirement, userCourses };
    }

    for (const group of reqDetails.courseGrps) {

        for (const courseId of group.courses) {
            const matchingUserCourse = userCourses.find(uc => 
                uc.id === courseId
            );

            if (!matchingUserCourse) continue;

            let completed = false;

            if (matchingUserCourse.usedInRequirements.includes(reqDetails.id)) {
                if (isTaken(matchingUserCourse)) {
                    processedRequirement.takenCourses.push(matchingUserCourse);
                } else {
                    processedRequirement.plannedCourses.push(matchingUserCourse);
                }
                completed = true;
            } else if (reqDetails.overlap?.some(id => 
                matchingUserCourse.usedInRequirements.includes(id)
            )) {
                processedRequirement.eligibleButNotUsedCourses.push(matchingUserCourse);
            } else if (!completed) {
                matchingUserCourse.usedInRequirements.push(reqDetails.id);
                if (isTaken(matchingUserCourse)) {
                    processedRequirement.takenCourses.push(matchingUserCourse);
                } else {
                    processedRequirement.plannedCourses.push(matchingUserCourse);
                }
                completed = true;
            } else {
                processedRequirement.eligibleButNotUsedCourses.push(matchingUserCourse);
            }
        }
    }

    processedRequirement.completed = 
        processedRequirement.takenCourses.length >= (reqDetails.number || 0);

    return { processedRequirement, userCourses };
};