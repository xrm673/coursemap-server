import { RawUserCourse } from "../user/user.model";
import { CourseWithTopic } from "../course/course.model";
import { Course } from "../course/course.model";

export const isPriorSemester = (semester: string, selectedSemester: string): boolean => {
    if (semester === "unspecified") {
        return true;
    }
    const semesterYear = parseInt(semester.slice(-2));
    const currentYear = parseInt(selectedSemester.slice(-2));
    if (semesterYear > currentYear) {
        return false;
    }
    if (semesterYear < currentYear) {
        return true;
    }
    
    // Years are the same, compare seasons
    const semesterSeason = semester.slice(0, 2);
    const currentSeason = selectedSemester.slice(0, 2);
    
    // Season order: WI, SP, SU, FA
    const seasonOrder = ["WI", "SP", "SU", "FA"];
    const semesterSeasonIndex = seasonOrder.indexOf(semesterSeason);
    const currentSeasonIndex = seasonOrder.indexOf(currentSeason);
    
    return semesterSeasonIndex < currentSeasonIndex;
}

export const isAvailableInLocation = (course: Course): boolean => {
    // 如果任何一个 enrollGroup 有 locationConflicts，则该课程在地点上不可用
    // 返回 true 当所有 enrollGroup 都没有 locationConflicts
    const hasLocationConflicts = course.enrollGroups?.some(group => group.locationConflicts) ?? false;
    return !hasLocationConflicts;
};

export const isAvailableInSemester = (course: Course, semester: string): boolean => {
    return course.enrollGroups?.some(group => 
        group.grpSmst.includes(semester)
    );
}

/**
 * 获取课程选项的唯一ID
 * 如果课程有 topic，使用 courseId + grpIdentifier
 * 否则使用 courseId
 */
export const getCourseOptionId = (course: Course | CourseWithTopic): string => {
    if ('grpIdentifier' in course && course.grpIdentifier) {
        return `${course._id}_${course.grpIdentifier}`;
    }
    return course._id;
};

/**
 * 比较两个 semester，返回排序值
 * 早的 semester 返回负数（排在前面）
 */
export const compareSemester = (semesterA: string, semesterB: string): number => {
    const yearA = parseInt(semesterA.slice(-2));
    const yearB = parseInt(semesterB.slice(-2));
    
    if (yearA !== yearB) {
        return yearA - yearB;
    }
    
    // Years are the same, compare seasons
    const seasonOrder = ["WI", "SP", "SU", "FA"];
    const seasonA = semesterA.slice(0, 2);
    const seasonB = semesterB.slice(0, 2);
    
    return seasonOrder.indexOf(seasonA) - seasonOrder.indexOf(seasonB);
};

/**
 * 在 userCourses 中找到匹配的课程
 */
export const findMatchingUserCourse = (
    course: Course | CourseWithTopic, 
    userCourses: RawUserCourse[]
): RawUserCourse | undefined => {
    return userCourses.find(userCourse => {
        const courseIdMatches = userCourse._id === course._id;
        
        // 如果课程有 grpIdentifier，也需要匹配
        if ('grpIdentifier' in course && course.grpIdentifier) {
            return courseIdMatches && userCourse.grpIdentifier === course.grpIdentifier;
        }
        
        return courseIdMatches;
    });
};