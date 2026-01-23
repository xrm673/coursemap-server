import { CourseSetNodeData } from "./model/requirement.model";
import { RawUserCourse } from "../user/user.model";
import { CourseOption } from "./dto/option.dto";
import { CourseWithTopic } from "../course/course.model";
import { Course } from "../course/course.model";
import { CourseUserState, CourseTakingStatus } from "./dto/option.dto";
import { getCourseOptionId } from "./course-utils";
import { getCoursesByIds } from "../course/course.service";
import { findMatchingUserCourse, isAvailableInLocation, isAvailableInSemester, compareSemester, isPriorSemester } from "./course-utils";

interface NodeStateResult {
    courseOptions: CourseOption[];
    nodeState: {
        isFulfilled: boolean;
        fulfilledCount: number;
        completedUsedOptionIds: string[];
        completedNotUsedOptionIds: string[];
        inProgressUsedOptionIds: string[];
        inProgressNotUsedOptionIds: string[];
        plannedUsedOptionIds: string[];
        plannedNotUsedOptionIds: string[];
        savedUsedOptionIds: string[];
        savedNotUsedOptionIds: string[];
    };
}

export const computeCourseSetNodeState = async (
    nodeData: CourseSetNodeData, 
    userCourses: RawUserCourse[], 
    selectedSemester: string,
    requirementId: string,
    conflictsWithRequirementIds: string[]
): Promise<NodeStateResult> => {
    
    // 1. 获取所有课程并生成 CourseOption（不含 allocation）
    const courses = await getCoursesByIds(nodeData.options);
    const allCourseOptions: CourseOption[] = [];

    for (const course of courses) {
        if (course.courseHasTopic) {
            const coursesWithTopic = getCoursesByTopics(course, nodeData);
            for (const courseWithTopic of coursesWithTopic) {
                const courseOption: CourseOption = {
                    optionId: getCourseOptionId(courseWithTopic),
                    type: "COURSE",
                    course: courseWithTopic,
                    userState: generateCourseUserState(courseWithTopic, userCourses, selectedSemester),
                    allocation: { isCountedHere: false, notCountedReasons: [] } // 临时值，后面会更新
                };
                allCourseOptions.push(courseOption);
            }
        } else {
            const courseOption: CourseOption = {
                optionId: getCourseOptionId(course),
                type: "COURSE",
                course: course,
                userState: generateCourseUserState(course, userCourses, selectedSemester),
                allocation: { isCountedHere: false, notCountedReasons: [] } // 临时值，后面会更新
            };
            allCourseOptions.push(courseOption);
        }
    }

    // 2. 筛选出在 userCourses 里的 options 并按优先级排序
    const scheduledOptions = allCourseOptions
        .filter(option => option.userState.isScheduled || option.userState.status === "SAVED")
        .sort((a, b) => compareCoursePriority(a, b, selectedSemester));

    // 3. 初始化 nodeState
    const nodeState = {
        isFulfilled: false,
        fulfilledCount: 0,
        completedUsedOptionIds: [] as string[],
        completedNotUsedOptionIds: [] as string[],
        inProgressUsedOptionIds: [] as string[],
        inProgressNotUsedOptionIds: [] as string[],
        plannedUsedOptionIds: [] as string[],
        plannedNotUsedOptionIds: [] as string[],
        savedUsedOptionIds: [] as string[],
        savedNotUsedOptionIds: [] as string[],
    };

    const pickCount = nodeData.rule.pick;
    let usedCount = 0;

    // 4. 遍历排序后的 options，分配到对应的数组
    for (const option of scheduledOptions) {
        const userCourse = findMatchingUserCourse(option.course, userCourses);
        if (!userCourse) continue;

        const status = option.userState.status;
        const isAlreadyUsedElsewhere = hasConflictingRequirement(
            userCourse, 
            requirementId, 
            conflictsWithRequirementIds
        );

        // 判断是否可以被当前 node 使用
        const canBeUsed = (usedCount < pickCount) && !isAlreadyUsedElsewhere;

        if (canBeUsed) {
            // 标记为已使用
            if (!userCourse.usedInRequirements.includes(requirementId)) {
                userCourse.usedInRequirements.push(requirementId);
            }

            // 根据状态分类到 *UsedOptionIds
            if (status === "COMPLETED") {
                nodeState.completedUsedOptionIds.push(option.optionId);
                usedCount++;
                nodeState.fulfilledCount++;
            } else if (status === "IN_PROGRESS") {
                nodeState.inProgressUsedOptionIds.push(option.optionId);
            } else if (status === "PLANNED") {
                nodeState.plannedUsedOptionIds.push(option.optionId);
            } else if (status === "SAVED") {
                nodeState.savedUsedOptionIds.push(option.optionId);
            }

            // 更新 allocation
            option.allocation = { isCountedHere: true };

        } else {
            // 根据状态分类到 *NotUsedOptionIds
            const notCountedReasons = [];
            if (usedCount >= pickCount) {
                notCountedReasons.push({ reason: "OVER_LIMIT" as const });
            }
            if (isAlreadyUsedElsewhere) {
                const conflictReqId = findConflictingRequirementId(userCourse, conflictsWithRequirementIds);
                notCountedReasons.push({ 
                    reason: "ALREADY_COUNTED_ELSEWHERE" as const,
                    requirementId: conflictReqId
                });
            }

            if (status === "COMPLETED") {
                nodeState.completedNotUsedOptionIds.push(option.optionId);
            } else if (status === "IN_PROGRESS") {
                nodeState.inProgressNotUsedOptionIds.push(option.optionId);
            } else if (status === "PLANNED") {
                nodeState.plannedNotUsedOptionIds.push(option.optionId);
            } else if (status === "SAVED") {
                nodeState.savedNotUsedOptionIds.push(option.optionId);
            }

            // 更新 allocation
            option.allocation = { 
                isCountedHere: false, 
                notCountedReasons 
            };
        }
    }

    // 5. 判断 node 是否已满足
    nodeState.isFulfilled = nodeState.fulfilledCount >= pickCount;

    return {
        courseOptions: allCourseOptions,
        nodeState
    };
};

const getCoursesByTopics = (course: Course, nodeData: CourseSetNodeData): CourseWithTopic[] => {
    let filteredGroups = course.enrollGroups;
    if (nodeData.courseNotes && nodeData.courseNotes.length > 0) {
        // check if the requirement has a course note for this course
        const courseNote = nodeData.courseNotes.find(note => note.courseId === course._id);
        if (courseNote && courseNote.grpIdentifierArray) {
            filteredGroups = filteredGroups.filter(group => 
                courseNote.grpIdentifierArray?.includes(group.grpIdentifier)
            );
        }
    }

    return filteredGroups.map(group => ({
        ...course,
        enrollGroups: [group],
        courseHasTopic: group.hasTopic,
        topic: group.topic
    } as CourseWithTopic));
};

const generateCourseUserState = (course: Course | CourseWithTopic, userCourses: RawUserCourse[], selectedSemester: string): CourseUserState => {
    const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
    const isSemesterAvailable = isAvailableInSemester(course, selectedSemester);
    const isLocationAvailable = isAvailableInLocation(course);
    const isAvailable = isSemesterAvailable && isLocationAvailable;
    
    const matchedCourse = findMatchingUserCourse(course, userCourses);

    if (isScheduled && matchedCourse) {
        return {
            isScheduled: true,
            status: status as "COMPLETED" | "IN_PROGRESS" | "PLANNED",
            isAvailable,
            isSemesterAvailable,
            isLocationAvailable,
            credit: matchedCourse.credit || 0,
            semester: matchedCourse.semester || "",
            sections: matchedCourse.sections || []
        };
    } else {
        return {
            isScheduled: false,
            status: status as "SAVED" | "NOT_ON_SCHEDULE",
            isAvailable,
            isSemesterAvailable,
            isLocationAvailable,
        };
    }
};

export const getCourseStatus = (reqCourse: Course | CourseWithTopic, userCourses: RawUserCourse[], selectedSemester: string): [CourseTakingStatus, boolean] => {
    const matchedCourse = findMatchingUserCourse(reqCourse, userCourses);
    if (!matchedCourse) return ["NOT_ON_SCHEDULE", false];
    if (!matchedCourse.isScheduled) return ["SAVED", false];
    if (matchedCourse.semester === selectedSemester) return ["IN_PROGRESS", true];
    if (isPriorSemester(matchedCourse.semester!, selectedSemester)) return ["COMPLETED", true];
    return ["PLANNED", true];
}

/**
 * 比较两个课程选项的优先级
 * 优先级：COMPLETED > IN_PROGRESS > PLANNED > SAVED
 * 同状态内按 semester 排序（早的优先）
 */
const compareCoursePriority = (
    a: CourseOption, 
    b: CourseOption, 
    selectedSemester: string
): number => {
    const statusPriority: Record<CourseTakingStatus, number> = {
        "COMPLETED": 0,
        "IN_PROGRESS": 1,
        "PLANNED": 2,
        "SAVED": 3,
        "NOT_ON_SCHEDULE": 4
    };

    const priorityA = statusPriority[a.userState.status];
    const priorityB = statusPriority[b.userState.status];

    if (priorityA !== priorityB) {
        return priorityA - priorityB;
    }

    // 同状态内按 semester 排序
    if (a.userState.isScheduled && b.userState.isScheduled) {
        const semesterA = a.userState.semester;
        const semesterB = b.userState.semester;
        
        // 如果有 unspecified，放在最前面
        if (semesterA === "unspecified") return -1;
        if (semesterB === "unspecified") return 1;
        
        // 比较 semester（早的优先）
        return compareSemester(semesterA, semesterB);
    }

    return 0;
};

// ============= 辅助函数 =============
/**
 * 检查课程是否已被互斥的 requirement 使用
 * 
 * conflictsWith 列表中的 requirements 是互斥的，不能共享课程
 * 只有不在 conflictsWith 列表中的 requirements 才可以共享课程
 */
const hasConflictingRequirement = (
    userCourse: RawUserCourse,
    currentRequirementId: string,
    conflictsWithRequirementIds: string[]
): boolean => {
    return userCourse.usedInRequirements.some(reqId => {
        // 如果是当前 requirement，不算冲突
        if (reqId === currentRequirementId) return false;
        
        // conflictsWith 表示互斥关系，这些 requirements 不能共享课程
        if (conflictsWithRequirementIds.includes(reqId)) return true;
        
        // 其他情况不算冲突（允许共享）
        return false;
    });
};

/**
 * 找到冲突的 requirement ID
 * 返回与当前 requirement 互斥的 requirement ID
 */
const findConflictingRequirementId = (
    userCourse: RawUserCourse,
    conflictsWithRequirementIds: string[]
): string | undefined => {
    return userCourse.usedInRequirements.find(reqId => {
        return conflictsWithRequirementIds.includes(reqId);
    });
};