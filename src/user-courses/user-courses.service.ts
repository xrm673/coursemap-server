import * as UserModel from '../user/user.model';
import * as CourseModel from '../course/course.model';
import { User, RawUserCourse, CourseForFavorites, CourseForSchedule, isCourseForSchedule } from '../user/user.model';
import { Course, CourseForRequirement, Section } from '../course/course.model';
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
        return processCourses(user.courses, coursesData);
    } catch (error) {
        console.error('Error in getCourses:', error);
        throw error;
    }
};

export const addCourseToSchedule = async (
    userId: string, 
    courseData: CourseForRequirement, 
    semester: string, 
    usedInRequirements: string[]
): Promise<(CourseForSchedule | CourseForFavorites)[]> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            user.courses = [];
        }

        const coursesData = await CourseModel.findByIds(user.courses.map(course => course._id));
        const originalUserCourses = processCourses(user.courses, coursesData);

        const existingCourse = user.courses.find(course => 
            course._id === courseData._id && course.grpIdentifier === courseData.grpIdentifier
        );

        if (existingCourse) {
            existingCourse.semester = semester;
            if (!existingCourse.isScheduled) {
                existingCourse.isScheduled = true;
                existingCourse.credit = courseData.enrollGroups[0].credits[0];
                existingCourse.sections = generateCourseSections(courseData, semester, originalUserCourses);
            }
            await user.save();
            
            const processed = originalUserCourses.find(c => 
                c._id === courseData._id && (c as any).grpIdentifier === courseData.grpIdentifier
            );
            if (processed) {
                (processed as any).semester = semester;
            }
            return originalUserCourses;
        }

        // course not exists, add it to the schedule
        const newRawCourse: RawUserCourse = {
            _id: courseData._id,
            isScheduled: true,
            usedInRequirements: usedInRequirements,
            semester: semester,
            credit: courseData.enrollGroups[0].credits[0],
            sections: generateCourseSections(courseData, semester, originalUserCourses)
        };
        if (courseData.grpIdentifier) {
            newRawCourse.grpIdentifier = courseData.grpIdentifier;
        }
        user.courses.push(newRawCourse);
        await user.save();
        
        const processedNewCourse = processCourse(newRawCourse, courseData);
        if (processedNewCourse) {
            originalUserCourses.push(processedNewCourse);
        }
        
        return originalUserCourses;
    } catch (error) {
        console.error('Error in addCourseToSchedule:', error);
        throw error;
    }
};

export const saveCourse = async (
    userId: string, 
    courseData: CourseForRequirement, 
    usedInRequirements: string[]
): Promise<(CourseForSchedule | CourseForFavorites)[]> => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserError('User not found');
        }

        if (!user.courses) {
            user.courses = [];
        }

        const coursesData = await CourseModel.findByIds(user.courses.map(course => course._id));
        const originalUserCourses = processCourses(user.courses, coursesData);

        const existingCourse = user.courses.find(course => 
            course._id === courseData._id && course.grpIdentifier === courseData.grpIdentifier
        );
        if (existingCourse) {           
            return originalUserCourses;
        }

        // course not exists, add it to the schedule
        const newRawCourse: RawUserCourse = {
            _id: courseData._id,
            isScheduled: false,
            usedInRequirements: usedInRequirements,
        };
        if (courseData.grpIdentifier) {
            newRawCourse.grpIdentifier = courseData.grpIdentifier;
        }
        user.courses.push(newRawCourse);
        await user.save();
        
        const processedNewCourse = processCourse(newRawCourse, courseData);
        if (processedNewCourse) {
            originalUserCourses.push(processedNewCourse);
        }
        
        return originalUserCourses;
    } catch (error) {
        console.error('Error in saveCourse:', error);
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
    updateData: Partial<Pick<RawUserCourse, 'usedInRequirements' | 'credit' | 'semester' | 'sections'>>
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
            isScheduled: false,
            grpIdentifier: originalCourse.grpIdentifier,
            usedInRequirements: originalCourse.usedInRequirements,
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

export const getUserCoursesInSemester = (userCourses: (CourseForSchedule | CourseForFavorites)[], semester: string) : (CourseForSchedule)[] => {
    return userCourses.filter(course => isCourseForSchedule(course) && course.semester === semester) as CourseForSchedule[];
}

// return all meeting times of the user courses in the semester
export const getUserSectionsInSemester = (userCoursesInSemester: CourseForSchedule[], semester: string) : Section[] => {
    const sections = new Set<Section>();
    for (const course of userCoursesInSemester) {
        for (const enrollGroup of course.enrollGroups) {
        for (const section of enrollGroup.sections || []) {
            const sectionId = `${section.type}-${section.nbr}`;
            if (section.semester === semester && course.sections.includes(sectionId)) {
            sections.add(section);
            }
        }
        }
    }
    return Array.from(sections);
}

export const areSectionsOverlap = (section1: Section, section2: Section) => {
    return false;
}

export const generateCourseSections = (course: Course, semester: string, userCourses: (CourseForSchedule | CourseForFavorites)[]) => {
    if (semester === 'unspecified') {
      return [];
    }
    let foundAvailableSections = false;
    // find userCourses and userSections
    const userCoursesInSemester = getUserCoursesInSemester(userCourses, semester);
    const userSectionsInSemester = getUserSectionsInSemester(userCoursesInSemester, semester);
  
    let newSections: string[] = [];
    // for each enroll group
    for (const enrollGroup of course.enrollGroups) {
      if (foundAvailableSections) {
        break;
      }
      let components = enrollGroup.components;
      for (const section of enrollGroup.sections || []) {
        if (section.semester === semester && section.type in components) {
          let sectionAvailable = false;
          for (const userSection of userSectionsInSemester) {
            if (!areSectionsOverlap(section, userSection)) {
              sectionAvailable = true;
              const newSectionId = `${section.type}-${section.nbr}`;
              newSections.push(newSectionId);
              components = components.filter(component => component !== section.type);
              break;
            }
          }
        }
      }
      if (components.length === 0) {
        foundAvailableSections = true;
        break;
      }
    }
    // if not found available sections in all enroll groups, find sections in the first enroll group
    if (!foundAvailableSections) {
      let enrollGroup = course.enrollGroups[0];
      let components = enrollGroup.components;
      for (const component of components) {
        for (const section of enrollGroup.sections || []) {
          if (section.semester === semester && section.type === component) {
            const newSectionId = `${component}-${section.nbr}`;
            newSections.push(newSectionId);
            components = components.filter(comp => comp !== section.type);
            break;
          }
        }
      }
    }
    return newSections;
  }

const processCourse = (userCourse: RawUserCourse, matchedCourse: Course | undefined): CourseForFavorites | CourseForSchedule | null => {
    if (!matchedCourse) return null;

    if (!userCourse.grpIdentifier) {
        return {
            ...matchedCourse,
            isScheduled: userCourse.isScheduled,
            usedInRequirements: userCourse.usedInRequirements,
            credit: userCourse.credit,
            semester: userCourse.semester,
            sections: userCourse.sections
        };
    } else {
        const matchedGroup = matchedCourse.enrollGroups.find(enrollGroup => enrollGroup.grpIdentifier === userCourse.grpIdentifier);
        if (matchedGroup) {
            return {
                ...matchedCourse,
                enrollGroups: [matchedGroup],
                grpIdentifier: userCourse.grpIdentifier,
                isScheduled: userCourse.isScheduled,
                usedInRequirements: userCourse.usedInRequirements,
                credit: userCourse.credit,
                semester: userCourse.semester,
                sections: userCourse.sections
            };
        }
    }
    return null;
}

const processCourses = (rawUserCourses: RawUserCourse[], coursesData: Course[]) => {
    const processedCourses: (CourseForFavorites | CourseForSchedule)[] = [];
    for (const userCourse of rawUserCourses) {
        const matchedCourse = coursesData.find(course => course._id === userCourse._id);
        const processed = processCourse(userCourse, matchedCourse);
        if (processed) {
            processedCourses.push(processed);
        }
    }
    return processedCourses;
}