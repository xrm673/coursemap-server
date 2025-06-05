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
    console.log('Processing requirements:', requirementIds);
    console.log('Initial user courses:', userCourses?.length || 0);
    
    const processedRequirements: ProcessedRequirement[] = [];
    let updatedUserCourses = userCourses || [];

    // Fetch all requirements in one query
    const requirements = await RequirementModel.findByIds(requirementIds);
    console.log('Found requirements:', requirements.map(r => r.name));

    for (const reqDetails of requirements) {
        console.log(`Processing requirement: ${reqDetails.name} (${reqDetails.type})`);
        
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
                courseGrps: reqDetails.courseGrps,
                overlap: reqDetails.overlap,
                completed: false,
                taken: [],
                planned: [],
                notUsed: [],
            });
            continue;
        }

        // Process based on requirement type
        if (reqDetails.type === "E") {
            const { processedRequirement, userCourses: newUserCourses } = await processElective(reqDetails, updatedUserCourses);
            console.log(`Processed elective requirement ${reqDetails.name}:`, {
                taken: processedRequirement.taken.length,
                planned: processedRequirement.planned.length,
                notUsed: processedRequirement.notUsed.length
            });
            processedRequirements.push(processedRequirement);
            updatedUserCourses = newUserCourses;
        } else if (reqDetails.type === "C") {
            const { processedRequirement, userCourses: newUserCourses } = await processCore(reqDetails, updatedUserCourses);
            console.log(`Processed core requirement ${reqDetails.name}:`, {
                taken: processedRequirement.taken.length,
                planned: processedRequirement.planned.length,
                notUsed: processedRequirement.notUsed.length
            });
            processedRequirements.push(processedRequirement);
            updatedUserCourses = newUserCourses;
        }
    }

    console.log('Final processed requirements:', processedRequirements.map(r => ({
        name: r.name,
        taken: r.taken.length,
        planned: r.planned.length,
        notUsed: r.notUsed.length
    })));

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
    console.log(`\nProcessing elective requirement: ${reqDetails.name}`);
    console.log('Available course IDs:', reqDetails.courseIds);
    console.log('Total user courses:', userCourses.length);

    const processedRequirement: ProcessedRequirement = {
        _id: reqDetails._id,
        type: reqDetails.type,
        majorId: reqDetails.majorId,
        name: reqDetails.name,
        descr: reqDetails.descr,
        numberOfRequiredCourses: reqDetails.numberOfRequiredCourses,
        courseIds: reqDetails.courseIds,
        courseNotes: reqDetails.courseNotes,
        courseGrps: reqDetails.courseGrps,
        overlap: reqDetails.overlap,
        completed: false,
        taken: [],
        planned: [],
        notUsed: []
    };

    const updatedUserCourses = [...userCourses];
    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const notUsed: CourseInSchedule[] = [];

    if (!reqDetails.courseIds) {
        console.log('No course IDs found for this requirement');
        return { processedRequirement, userCourses: updatedUserCourses };
    }

    // Find all matching courses in the user's schedule
    const matchingUserCourses = updatedUserCourses.filter(userCourse => 
        isMatchingCourse(reqDetails, userCourse)
    );
    console.log('Found matching courses:', matchingUserCourses.map(c => ({
        id: c._id,
        grpIdentifier: c.grpIdentifier,
        usedIn: c.usedInRequirements
    })));

    // Process the matching courses
    for (const matchingCourse of matchingUserCourses) {
        console.log(`\nProcessing matching course ${matchingCourse._id}:`);
        console.log('- Current usedInRequirements:', matchingCourse.usedInRequirements);
        console.log('- Current requirement ID:', reqDetails._id);
        
        if (matchingCourse.usedInRequirements.includes(reqDetails._id)) {
            // Course already used in this requirement
            console.log('Course already used in this requirement');
            if (isTaken(matchingCourse)) {
                console.log('-> Adding to taken');
                taken.push(matchingCourse);
            } else {
                console.log('-> Adding to planned');
                planned.push(matchingCourse);
            }
        } else if (reqDetails.overlap?.some(reqId => 
            matchingCourse.usedInRequirements.includes(reqId)
        )) {
            // Course used in an overlapping requirement
            console.log('Course used in an overlapping requirement');
            console.log('-> Adding to notUsed');
            notUsed.push(matchingCourse);
        } else {
            // Course not used yet
            console.log('Course not used yet, adding to this requirement');
            matchingCourse.usedInRequirements.push(reqDetails._id);
            if (isTaken(matchingCourse)) {
                console.log('-> Adding to taken');
                taken.push(matchingCourse);
            } else {
                console.log('-> Adding to planned');
                planned.push(matchingCourse);
            }
        }
    }

    processedRequirement.taken = taken;
    processedRequirement.planned = planned;
    processedRequirement.notUsed = notUsed;

    processedRequirement.completed = 
        processedRequirement.taken.length >= (reqDetails.numberOfRequiredCourses || 0);

    console.log('\nFinal counts for requirement:', reqDetails.name);
    console.log('- Taken:', taken.length);
    console.log('- Planned:', planned.length);
    console.log('- Not Used:', notUsed.length);
    console.log('- Completed:', processedRequirement.completed);
    console.log('- Required courses:', reqDetails.numberOfRequiredCourses);

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
        courseGrps: reqDetails.courseGrps,
        overlap: reqDetails.overlap,
        completed: false,
        taken: [],
        planned: [],
        notUsed: []
    };

    const taken: CourseInSchedule[] = [];
    const planned: CourseInSchedule[] = [];
    const notUsed: CourseInSchedule[] = [];

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
                notUsed.push(matchingUserCourse);
            } else if (!completed) {
                matchingUserCourse.usedInRequirements.push(reqDetails._id);
                if (isTaken(matchingUserCourse)) {
                    taken.push(matchingUserCourse);
                } else {
                    planned.push(matchingUserCourse);
                }
                completed = true;
            } else {
                notUsed.push(matchingUserCourse);
            }
        }
    }

    // Fetch full course data for all courses
    processedRequirement.taken = taken;
    processedRequirement.planned = planned;
    processedRequirement.notUsed = notUsed;

    processedRequirement.completed = 
        processedRequirement.taken.length >= (reqDetails.numberOfRequiredCourses || 0);

    return { processedRequirement, userCourses };
};

function isMatchingCourse(reqDetails: Requirement, userCourse: CourseInSchedule): boolean {
    console.log(`\nChecking if course ${userCourse._id} matches requirement ${reqDetails.name}`);
    console.log('Course grpIdentifier:', userCourse.grpIdentifier);
    
    // First check if the course ID matches any in courseIds
    if (reqDetails.courseIds && reqDetails.courseIds.includes(userCourse._id)) {
        console.log('Course ID found in requirement courseIds');
        
        // If the userCourse doesn't have a grpIdentifier, it's a match
        if (!userCourse.grpIdentifier) {
            console.log('No grpIdentifier needed, course matches');
            return true;
        } else {
            if (reqDetails.courseNotes) {
                console.log('Checking course notes for grpIdentifier match');
                const courseNote = reqDetails.courseNotes.find(courseNote => 
                    courseNote.courseId === userCourse._id
                )
                if (courseNote && courseNote.grpIdentifierArray) {
                    const matches = courseNote.grpIdentifierArray.includes(userCourse.grpIdentifier);
                    console.log('Found course note with grpIdentifierArray:', courseNote.grpIdentifierArray);
                    console.log('Matches:', matches);
                    return matches;
                } 
            }
            console.log('No specific grpIdentifier restrictions, course matches');
            return true;
        }
    }
    console.log('Course ID not found in requirement courseIds');
    return false;
}