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
    majorId: string, uid?: string
): Promise<{
    majorWithRequirements: ProcessedMajor,
    userCourses: CourseInSchedule[]
}> => {
    const majorDetails = await getMajor(majorId);
    let userDetails: User | undefined = undefined;
    let userCourses: CourseInSchedule[] = [];
    
    if (uid) {
        userDetails = await getUser(uid);
    }
    const selectedCollegeId = getDefaultCollege(majorDetails, userDetails);
    const selectedYear = getDefaultYear(userDetails);

    // Get basic requirements
    const {
        basicRequirements,
        userCoursesAfterBasic
    } = await getBasicRequirements(
        majorDetails, selectedCollegeId, selectedYear, userDetails
    );
    userCourses = userCoursesAfterBasic;

    // Get concentration requirements if they exist
    let concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];
    if (majorDetails.concentrations) {
        const result = await getConcentrationRequirements(majorDetails, userDetails);
        concentrationRequirements = result.concentrationRequirements;
        userCourses = result.userCourses;
    }

    // Get end requirements if they exist
    let endRequirements: ProcessedRequirement[] = [];
    if (majorDetails.rawEndRequirements) {
        const result = await getEndRequirements(
            majorDetails, selectedCollegeId, selectedYear, userDetails
        );
        endRequirements = result.endRequirements;
        userCourses = result.userCoursesAfterEnd;
    }

    const processedMajor: ProcessedMajor = {
        _id: majorDetails._id,
        name: majorDetails.name,
        description: majorDetails.description,
        needsYear: majorDetails.needsYear,
        needsCollege: majorDetails.needsCollege,
        colleges: majorDetails.colleges,
        onboardingCourses: majorDetails.onboardingCourses,
        selectedCollegeId,
        selectedYear,
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
    selectedCollegeId: string,
    selectedYear: string,
    userDetails?: User
): Promise<{
    basicRequirements: ProcessedRequirement[],
    userCoursesAfterBasic: CourseInSchedule[]
}> => {
    const basicReqs = majorDetails.rawBasicRequirements?.find(
        req => {
          const yearMatches = !majorDetails.needsYear || req.year === selectedYear;
          const collegeMatches = !majorDetails.needsCollege || req.college === selectedCollegeId;
          return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (userDetails) {
        userCourses = getUserCourses(userDetails);
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

    const userConcentrations = getUserConcentrations(userDetails, majorDetails);
    let userCourses: CourseInSchedule[] = [];
    const concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];

    for (const concentration of userConcentrations) {
        const concentrationReqs = majorDetails.concentrations?.find(
            req => req.concentrationName === concentration
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
    selectedCollegeId: string,
    selectedYear: string,
    userDetails?: User,
): Promise<{
    endRequirements: ProcessedRequirement[],
    userCoursesAfterEnd: CourseInSchedule[]
}> => {

    const endReqs = majorDetails.rawEndRequirements?.find(
        req => {
            const yearMatches = !majorDetails.needsYear || req.year === selectedYear;
            const collegeMatches = !majorDetails.needsCollege || req.college === selectedCollegeId;
            return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (userDetails) {
        userCourses = getUserCourses(userDetails);
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
export const getDefaultCollege = (majorDetails: Major, userDetails?: User) : string => {
    // If user exists and their college is in the major's colleges, use it
    if (userDetails && userDetails.collegeId && majorDetails.colleges.find(college => college.collegeId === userDetails.collegeId)) {
        return userDetails.collegeId;
    }

    // Otherwise return the first college from the major's colleges
    return majorDetails.colleges[0]?.collegeId || '';
};


/*
    Return the default year a user should select for a major
*/
export const getDefaultYear = (userDetails?: User): string => {
    // If user exists, use their year
    if (userDetails && userDetails.year) {
        return userDetails.year;
    }

    // Otherwise return the latest year
    return LATEST_YEAR.toString();
};


/*
    Return the concentrations of a major
*/
export const getConcentrations = (majorDetails: Major): string[] => {
    if (!majorDetails.concentrations) {
        return [];
    }

    // Extract all concentration names from the major's concentrations
    return majorDetails.concentrations.map(concentration => concentration.concentrationName);
};

