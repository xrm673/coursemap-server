import * as UserModel from '../user/user.model';
import * as CourseModel from '../course/course.model';
import { User, RawUserCourse, CourseForFavorites, CourseForSchedule, isCourseForSchedule } from '../user/user.model';
import { UserError } from '../user/user.service';

export class UserCoursesError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserCoursesError';
    }
}

export const getCourses = async (userId: string): Promise<(CourseForSchedule | CourseForFavorites)[]> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }
        const coursesData = await CourseModel.findByIds(user.courses.map(course => course._id));
        const processedCourses: (CourseForFavorites | CourseForSchedule)[] = [];
        for (const userCourse of user.courses) {
            const matchedCourse = coursesData.find(course => course._id === userCourse._id);
            if (matchedCourse) {
                if (!userCourse.grpIdentifier) {
                    processedCourses.push({
                        ...matchedCourse,
                        usedInRequirements: userCourse.usedInRequirements,
                        credit: userCourse.credit,
                        semester: userCourse.semester
                    });
                } else {
                    const matchedGroup = matchedCourse.enrollGroups.find(enrollGroup => enrollGroup.grpIdentifier === userCourse.grpIdentifier);
                    if (matchedGroup) {
                        processedCourses.push({
                            ...matchedCourse,
                            enrollGroups: [matchedGroup],
                            grpIdentifier: userCourse.grpIdentifier,
                            usedInRequirements: userCourse.usedInRequirements,
                            credit: userCourse.credit,
                            semester: userCourse.semester
                        });
                    }
                }
            }
        }
        return processedCourses;
    } catch (error) {
        console.error('Error in getCourses:', error);
        throw error;
    }
};

export const addCourses = async (userId: string, coursesData: (CourseForSchedule | CourseForFavorites)[]): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            user.courses = [];
        }

        for (const courseData of coursesData) {
            if (isCourseForSchedule(courseData)) {
                const isDuplicate = user.courses.some(course => coursesMatch(course, courseData));
                if (isDuplicate) {
                    const existingIndex = user.courses.findIndex(course => coursesMatch(course, courseData));
                    if (existingIndex !== -1) {
                        const existing = user.courses[existingIndex];
                        existing.semester = courseData.semester;
                        existing.credit = courseData.credit;
                        existing.sections = courseData.sections;
                        if (courseData.grpIdentifier) {
                            existing.grpIdentifier = courseData.grpIdentifier;
                        }
                    }
                    continue;
                }
                if (!isDuplicate) {
                    const newCourse: RawUserCourse = {
                        _id: courseData._id,
                        usedInRequirements: courseData.usedInRequirements,
                        semester: courseData.semester,
                        credit: courseData.credit,
                        sections: courseData.sections
                    };
                    if (courseData.grpIdentifier) {
                        newCourse.grpIdentifier = courseData.grpIdentifier;
                    }
                    user.courses.push(newCourse);
                }

            } else {
                const isDuplicate = user.courses.some(course => coursesMatch(course, courseData));
                if (isDuplicate) {
                    throw new UserCoursesError(`Duplicate course found: ${courseData._id}`);
                }
                if (!isDuplicate) {
                    const newCourse: RawUserCourse = {
                        _id: courseData._id,
                        usedInRequirements: courseData.usedInRequirements
                    };
                    if (courseData.grpIdentifier) {
                        newCourse.grpIdentifier = courseData.grpIdentifier;
                    }
                    user.courses.push(newCourse);
                }
            }
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error in addCoursesToSchedule:', error);
        throw error;
    }
};


export const removeCourses = async (userId: string, coursesData: (CourseForSchedule | CourseForFavorites)[]): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            throw new UserCoursesError('No schedule data found');
        }

        let notFoundCourses: string[] = [];

        for (const courseData of coursesData) {
            if (isCourseForSchedule(courseData)) {
                const courseIndex = user.courses.findIndex(course => coursesMatch(course, courseData));

                if (courseIndex === -1) {
                    notFoundCourses.push(`${courseData._id} (${courseData.semester})`);
                } else {
                    user.courses.splice(courseIndex, 1);
                }
            } else {
                const courseIndex = user.courses.findIndex(course => coursesMatch(course, courseData));

                if (courseIndex === -1) {
                    notFoundCourses.push(`${courseData._id}`);
                } else {
                    user.courses.splice(courseIndex, 1);
                }
            }
        }

        if (notFoundCourses.length > 0) {
            throw new UserCoursesError(`The following courses were not found in schedule: ${notFoundCourses.join(', ')}`);
        }

        await user.save();
    } catch (error) {
        console.error('Error in removeCoursesFromSchedule:', error);
        throw error;
    }
};

export const coursesMatch = (
    rawCourse: RawUserCourse,
    otherCourse: CourseForSchedule | CourseForFavorites
) => {
    const otherHasGrp = 'grpIdentifier' in otherCourse && Boolean((otherCourse as any).grpIdentifier);
    const rawCourseHasGrp = 'grpIdentifier' in rawCourse && Boolean((rawCourse as any).grpIdentifier);

    // If the incoming payload includes a grpIdentifier (topic/sectioned), require exact group match
    if (otherHasGrp) {
        return (
            rawCourseHasGrp &&
            rawCourse._id === otherCourse._id &&
            (rawCourse as any).grpIdentifier === (otherCourse as any).grpIdentifier
        );
    }

    // Otherwise, fall back to matching by _id (non-topic or payload lacks group info)
    return rawCourse._id === otherCourse._id;
};