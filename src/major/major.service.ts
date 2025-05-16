// src/major/major.service.ts
// Business logic for majors

import * as MajorModel from './major.model';
import { Major, ProcessedMajor } from './major.model';
import { User } from '../user/user.model';
import { CourseInSchedule } from '../course/course.model';
import { ProcessedRequirement } from '../requirement/requirement.model';
import { LATEST_YEAR } from '../utils/constants';
import { processRequirements } from '../requirement/requirement.service';
import { getUser, getUserConcentrations, getUserCourses } from '../user/user.service';

/*
    Get a major by its id
*/
export const getMajor = async (majorId: string): Promise<Major> => {
    const major = await MajorModel.findById(majorId);
    if (!major) {
        throw new Error('Major not found');
    }
    return major;
};


export const getMajorWithRequirements = async (
    majorId: string,
    userId?: string,
    selectedCollege?: string,
    selectedYear?: number
): Promise<{
    majorWithRequirements: ProcessedMajor,
    userCourses: CourseInSchedule[]
}> => {
    const majorDetails = await getMajor(majorId);
    let userDetails: User | undefined = undefined;
    let userCourses: CourseInSchedule[] = [];
    let basicRequirements: ProcessedRequirement[] = [];
    let concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];
    let endRequirements: ProcessedRequirement[] = [];

    if (userId) {
        userDetails = await getUser(userId);
    }

    const {
        basicRequirements: basicReqs, userCoursesAfterBasic
    } = await getBasicRequirements(
        majorDetails, userDetails, selectedCollege, selectedYear
    );
    basicRequirements = basicReqs;
    userCourses = userCoursesAfterBasic;

    if (majorDetails.concentrations) {
        const {
            concentrationRequirements: concentrationReqs,
            userCourses: userCoursesAfterConcentration
        } = await getConcentrationRequirements(
            majorDetails, userDetails
        );
        concentrationRequirements = concentrationReqs;
        userCourses = userCoursesAfterConcentration;
    }

    if (majorDetails.endRequirements) {
        const {
            endRequirements: endReqs, userCoursesAfterEnd
        } = await getEndRequirements(
            majorDetails, userDetails, selectedCollege, selectedYear
        );
        endRequirements = endReqs;
        userCourses = userCoursesAfterEnd;
    }

    const processedMajor: ProcessedMajor = {
        id: majorDetails.id,
        name: majorDetails.name,
        description: majorDetails.description,
        needsYear: majorDetails.needsYear,
        needsCollege: majorDetails.needsCollege,
        basicRequirements,
        concentrationRequirements,
        endRequirements
    };

    return { majorWithRequirements: processedMajor, userCourses };
};

/*
    Get an array of basic requirements ids for a major
*/
export const getBasicRequirements = async (
    majorDetails: Major,
    userDetails?: User,
    selectedCollege?: string,
    selectedYear?: number
): Promise<{
    basicRequirements: ProcessedRequirement[],
    userCoursesAfterBasic: CourseInSchedule[]
}> => {
    if (!selectedCollege) {
        selectedCollege = await getDefaultCollege(majorDetails, userDetails);
    }
    if (!selectedYear) {
        selectedYear = await getDefaultYear(majorDetails, userDetails);
    }

    const basicReqs = majorDetails.basicRequirements?.find(
        req => {
          const yearMatches = !majorDetails.needsYear || req.year === selectedYear;
          const collegeMatches = !majorDetails.needsCollege || req.college === selectedCollege;
          return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (userDetails) {
        userCourses = await getUserCourses(userDetails);
    }

    if (!basicReqs) {
        return {
            basicRequirements: [],
            userCoursesAfterBasic: userCourses || []
        };
    }
    
    const {
        requirements: basicRequirements,
        userCourses: userCoursesAfterBasic
    } = await processRequirements(basicReqs.requirements, userCourses);
    
    return {
        basicRequirements,
        userCoursesAfterBasic
    };
};


/*
    Get an array of concentration requirements ids for a major
*/
export const getConcentrationRequirements = async (
    majorDetails: Major,
    userDetails?: User
): Promise<{
    concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }>,
    userCourses: CourseInSchedule[]
}> => {  
    if (!userDetails) {
        return {
            concentrationRequirements: [],
            userCourses: []
        };
    }

    const userConcentrations = await getUserConcentrations(userDetails, majorDetails);
    let userCourses: CourseInSchedule[] = [];
    const concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];

    for (const concentration of userConcentrations) {
        const concentrationReqs = majorDetails.concentrations?.find(
            req => req.concentration === concentration
        );
        if (concentrationReqs) {
            const {
                requirements: processedReqs,
                userCourses: newUserCourses
            } = await processRequirements(concentrationReqs.requirements, userCourses);
            
            concentrationRequirements.push({
                concentration,
                requirements: processedReqs
            });
            userCourses = newUserCourses;
        }
    }

    return {
        concentrationRequirements,
        userCourses
    };
};


/*
    Get an array of end requirements ids for a major
*/
export const getEndRequirements = async (
    majorDetails: Major,
    userDetails?: User,
    selectedCollege?: string,
    selectedYear?: number
): Promise<{
    endRequirements: ProcessedRequirement[],
    userCoursesAfterEnd: CourseInSchedule[]
}> => {
    if (!selectedCollege) {
        selectedCollege = await getDefaultCollege(majorDetails, userDetails);
    }
    if (!selectedYear) {
        selectedYear = await getDefaultYear(majorDetails, userDetails);
    }

    const endReqs = majorDetails.endRequirements?.find(
        req => {
            const yearMatches = !majorDetails.needsYear || req.year === selectedYear;
            const collegeMatches = !majorDetails.needsCollege || req.college === selectedCollege;
            return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (userDetails) {
        userCourses = await getUserCourses(userDetails);
    }

    if (!endReqs) {
        return {
            endRequirements: [],
            userCoursesAfterEnd: userCourses
        };
    }

    const {
        requirements: endRequirements,
        userCourses: userCoursesAfterEnd
    } = await processRequirements(endReqs.requirements, userCourses);

    return {
        endRequirements,
        userCoursesAfterEnd
    };
};


/*
    Return the default college a user should select for a major
*/
export const getDefaultCollege = async (
    majorDetails: Major, 
    userDetails?: User
) : Promise<string> => {
    // If user exists and their college is in the major's colleges, use it
    if (userDetails && majorDetails.colleges.includes(userDetails.college)) {
        return userDetails.college;
    }

    // Otherwise return the first college from the major's colleges
    return majorDetails.colleges[0] || '';
};


/*
    Return the default year a user should select for a major
*/
export const getDefaultYear = async (
    majorDetails: Major, 
    userDetails?: User
): Promise<number> => {
    // If user exists, use their year
    if (userDetails) {
        return userDetails.year;
    }

    // Otherwise return the latest year
    return LATEST_YEAR;
};


/*
    Return the concentrations of a major
*/
export const getConcentrations = async (
    majorDetails: Major
): Promise<string[]> => {
    if (!majorDetails.concentrations) {
        return [];
    }

    // Extract all concentration names from the major's concentrations
    return majorDetails.concentrations.map(concentration => concentration.concentration);
};


