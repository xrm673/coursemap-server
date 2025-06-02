// src/major/major.service.ts
// Business logic for majors

import * as MajorModel from './major.model';
import { Major, ProcessedMajor } from './major.model';
import { User } from '../user/user.model';
import { CourseInSchedule } from '../course/course.model';
import { ProcessedRequirement } from '../requirement/requirement.model';
import { LATEST_YEAR } from '../utils/constants';
import { processRequirements } from '../requirement/requirement.service';
import { getUser, getUserConcentrations, getUserCourses, checkIsUserMajor } from '../user/user.service';

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
    majorId: string, userId?: string
): Promise<{
    processedMajor: ProcessedMajor,
    userCourses: CourseInSchedule[]
}> => {
    const major = await getMajor(majorId);
    let user: User | undefined = undefined;
    let userCourses: CourseInSchedule[] = [];
    let isUserMajor: boolean = false;
    
    if (userId) {
        user = await getUser(userId) as User;
        isUserMajor = checkIsUserMajor(user, majorId);
    }
    const selectedCollegeId = getDefaultCollege(major, user);
    const selectedYear = getDefaultYear(user);

    // Get basic requirements
    const {
        basicRequirements,
        userCoursesAfterBasic
    } = await getBasicRequirements(
        major, selectedCollegeId, selectedYear, user
    );
    userCourses = userCoursesAfterBasic;

    // Get concentration requirements if they exist
    let concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];
    if (major.concentrations) {
        const result = await getConcentrationRequirements(major, user);
        concentrationRequirements = result.concentrationRequirements;
        userCourses = result.userCourses;
    }

    // Get end requirements if they exist
    let endRequirements: ProcessedRequirement[] = [];
    if (major.rawEndRequirements) {
        const result = await getEndRequirements(
            major, selectedCollegeId, selectedYear, user
        );
        endRequirements = result.endRequirements;
        userCourses = result.userCoursesAfterEnd;
    }

    const processedMajor: ProcessedMajor = {
        _id: major._id,
        name: major.name,
        description: major.description,
        needsYear: major.needsYear,
        needsCollege: major.needsCollege,
        colleges: major.colleges,
        onboardingCourses: major.onboardingCourses,
        isUserMajor,
        selectedCollegeId,
        selectedYear,
        basicRequirements,
        concentrationRequirements,
        endRequirements
    };

    return { processedMajor, userCourses };
};

/*
    Get an array of basic requirements ids for a major
*/
export const getBasicRequirements = async (
    major: Major,
    selectedCollegeId: string,
    selectedYear: string,
    user?: User
): Promise<{
    basicRequirements: ProcessedRequirement[],
    userCoursesAfterBasic: CourseInSchedule[]
}> => {
    const basicReqs = major.rawBasicRequirements?.find(
        req => {
          const yearMatches = !major.needsYear || req.year === selectedYear;
          const collegeMatches = !major.needsCollege || req.college === selectedCollegeId;
          return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (user) {
        userCourses = getUserCourses(user);
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
    major: Major,
    user?: User
): Promise<{
    concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }>,
    userCourses: CourseInSchedule[]
}> => {  
    if (!user) {
        return {
            concentrationRequirements: [],
            userCourses: []
        };
    }

    const userConcentrations = getUserConcentrations(user, major);
    let userCourses: CourseInSchedule[] = [];
    const concentrationRequirements: Array<{
        concentration: string;
        requirements: ProcessedRequirement[];
    }> = [];

    for (const concentration of userConcentrations) {
        const concentrationReqs = major.concentrations?.find(
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
    major: Major,
    selectedCollegeId: string,
    selectedYear: string,
    user?: User,
): Promise<{
    endRequirements: ProcessedRequirement[],
    userCoursesAfterEnd: CourseInSchedule[]
}> => {

    const endReqs = major.rawEndRequirements?.find(
        req => {
            const yearMatches = !major.needsYear || req.year === selectedYear;
            const collegeMatches = !major.needsCollege || req.college === selectedCollegeId;
            return yearMatches && collegeMatches;
        }
    );

    let userCourses: CourseInSchedule[] = [];
    if (user) {
        userCourses = getUserCourses(user);
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
export const getDefaultCollege = (major: Major, user?: User) : string => {
    // If user exists and their college is in the major's colleges, use it
    if (user && user.college.collegeId 
        && major.colleges.find(college => college.collegeId === user.college.collegeId)) {
        return user.college.collegeId;
    }

    // Otherwise return the first college from the major's colleges
    return major.colleges[0]?.collegeId || '';
};


/*
    Return the default year a user should select for a major
*/
export const getDefaultYear = (user?: User): string => {
    // If user exists, use their year
    if (user && user.year) {
        return user.year;
    }

    // Otherwise return the latest year
    return LATEST_YEAR.toString();
};


/*
    Return the concentrations of a major
*/
export const getConcentrations = (major: Major): string[] => {
    if (!major.concentrations) {
        return [];
    }

    // Extract all concentration names from the major's concentrations
    return major.concentrations.map(concentration => concentration.concentrationName);
};

