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
                        considered: userCourse.considered,
                        credit: userCourse.credit,
                        semester: userCourse.semester,
                        sections: userCourse.sections
                    });
                } else {
                    const matchedGroup = matchedCourse.enrollGroups.find(enrollGroup => enrollGroup.grpIdentifier === userCourse.grpIdentifier);
                    if (matchedGroup) {
                        processedCourses.push({
                            ...matchedCourse,
                            enrollGroups: [matchedGroup],
                            grpIdentifier: userCourse.grpIdentifier,
                            considered: userCourse.considered,
                            usedInRequirements: userCourse.usedInRequirements,
                            credit: userCourse.credit,
                            semester: userCourse.semester,
                            sections: userCourse.sections
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

export const addCourse = async (userId: string, courseData: CourseForSchedule | CourseForFavorites): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            user.courses = [];
        }

        if (isCourseForSchedule(courseData)) {
            const isDuplicate = user.courses.some(course => coursesMatch(course, courseData));
            if (isDuplicate) {
                throw new UserCoursesError(`Duplicate course found: ${courseData._id}`);
            }
            const newCourse: RawUserCourse = {
                _id: courseData._id,
                usedInRequirements: courseData.usedInRequirements,
                considered: courseData.considered,
                semester: courseData.semester,
                credit: courseData.credit,
                sections: courseData.sections
            };
            if (courseData.grpIdentifier) {
                newCourse.grpIdentifier = courseData.grpIdentifier;
            }
            user.courses.push(newCourse);

        } else {
            const isDuplicate = user.courses.some(course => coursesMatch(course, courseData));
            if (isDuplicate) {
                throw new UserCoursesError(`Duplicate course found: ${courseData._id}`);
            }
            const newCourse: RawUserCourse = {
                _id: courseData._id,
                usedInRequirements: courseData.usedInRequirements,
                considered: courseData.considered,
            };
            if (courseData.grpIdentifier) {
                newCourse.grpIdentifier = courseData.grpIdentifier;
            }
            user.courses.push(newCourse);
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error in addCourseToSchedule:', error);
        throw error;
    }
};


export const deleteCourse = async (userId: string, courseData: CourseForSchedule | CourseForFavorites): Promise<void> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            throw new UserCoursesError('No schedule data found');
        }

        let notFoundCourses: string[] = [];

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

        if (notFoundCourses.length > 0) {
            throw new UserCoursesError(`The following courses were not found in schedule: ${notFoundCourses.join(', ')}`);
        }

        await user.save();
    } catch (error) {
        console.error('Error in deleteCoursesFromSchedule:', error);
        throw error;
    }
};

export const updateCourse = async (
    userId: string, 
    courseId: string, 
    grpIdentifier: string | undefined,
    updateData: Partial<Pick<RawUserCourse, 'usedInRequirements' | 'considered' | 'credit' | 'semester' | 'sections'>>
): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            throw new UserCoursesError('No courses found');
        }

        // Find the course to update
        const courseIndex = user.courses.findIndex(course => {
            if (grpIdentifier) {
                return course._id === courseId && course.grpIdentifier === grpIdentifier;
            }
            return course._id === courseId;
        });

        if (courseIndex === -1) {
            throw new UserCoursesError(`Course not found: ${courseId}${grpIdentifier ? ` (${grpIdentifier})` : ''}`);
        }

        // Update the course with provided fields
        const courseToUpdate = user.courses[courseIndex];
        
        if ('usedInRequirements' in updateData) {
            courseToUpdate.usedInRequirements = updateData.usedInRequirements || [];
        }
        if (updateData.considered !== undefined && updateData.considered !== null) {
            courseToUpdate.considered = updateData.considered;
        }
        if ('credit' in updateData) {
            courseToUpdate.credit = updateData.credit === null ? undefined : updateData.credit;
        }
        if ('semester' in updateData) {
            courseToUpdate.semester = updateData.semester === null ? undefined : updateData.semester;
        }
        if ('sections' in updateData) {
            courseToUpdate.sections = updateData.sections;
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error in updateCourse:', error);
        throw error;
    }
};

export const removeCourseFromSchedule = async (userId: string, courseData: CourseForSchedule): Promise<User> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        // Find the course to update
        const courseIndex = user.courses.findIndex(course => {
            if (courseData.grpIdentifier) {
                return course._id === courseData._id && course.grpIdentifier === courseData.grpIdentifier;
            }
            return course._id === courseData._id;
        });

        if (courseIndex === -1) {
            throw new UserCoursesError(`Course not found: ${courseData._id}${courseData.grpIdentifier ? ` (${courseData.grpIdentifier})` : ''}`);
        }

        // Remove schedule-specific fields to convert CourseForSchedule to CourseForFavorites
        const originalCourse = user.courses[courseIndex];
        
        // Rebuild the course object without the schedule-specific fields
        const updatedCourse: RawUserCourse = {
            _id: originalCourse._id,
            grpIdentifier: originalCourse.grpIdentifier,
            usedInRequirements: originalCourse.usedInRequirements,
            considered: originalCourse.considered,
        };
        
        // Replace the course in the array
        user.courses[courseIndex] = updatedCourse;
        
        // Mark the courses array as modified so Mongoose knows to save the changes
        user.markModified('courses');

        // Save the updated user
        const updatedUser = await user.save();
        return updatedUser;
        
    }
    catch (error) {
        console.error('Error in removeCourseFromSchedule:', error);
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