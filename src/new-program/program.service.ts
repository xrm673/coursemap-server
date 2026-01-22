import { UserModel } from "../user/user.schema";
import { ProgramModel } from "../program/program.schema";
import { ProgramData } from "./model/program.model";
import { User } from "../user/user.model";
import { CourseSetNodeData } from "./model/requirement.model";
import { Course, CourseWithTopic } from "../course/course.model";
import { RawUserCourse } from "../user/user.model";

import { ProgramResponse } from "./dto/program.dto";
import { RequirementModel } from "../requirement/requirement.schema";
import { getCoursesByIds } from "../course/course.service";
import { Allocation, CourseOption, CourseTakingStatus, CourseUserState } from "./dto/option.dto";
import { Requirement } from "./dto/requirements.dto";
import { Node, CourseSetNode, GroupNode } from "./dto/node.dto";
import { RequirementData, NodeData } from "./model/requirement.model";

export const getProgram = async (programId: string, userId: string, selectedSemester: string): Promise<ProgramResponse> => {
    
    // 从数据库获取 program 信息
    const programDoc = await ProgramModel.findById(programId);
    if (!programDoc) {
        throw new Error('Program not found');
    }

    // 从数据库获取 user 信息
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // TODO: 需要将旧的 Program schema 转换为新的 ProgramData 格式
    // 暂时用类型断言，后续需要实现转换函数
    const program = programDoc as any as ProgramData;

    // 根据user信息，从program的requirementSets中筛选出符合user的requirementSets
    const userRequirementIds = getRequirementIds(user, program);

    // 通过requirementids，从数据库获取requirements
    const requirementDocs = await RequirementModel.find({ _id: { $in: userRequirementIds } });

    // TODO: 需要将旧的 Requirement schema 转换为新的 RequirementData 格式
    const requirementsData = requirementDocs as any as RequirementData[];

    // 构建所有 requirements
    const requirementsList: Requirement[] = [];
    for (const reqData of requirementsData) {
        const requirement = await buildRequirement(
            reqData,
            user.courses,
            selectedSemester,
            requirementsData
        );
        requirementsList.push(requirement);
    }

    // 计算 program 级别的 summary
    const programSummary = {
        isUserProgram: isUserProgram(program, user),
        isFulfilled: requirementsList.every(req => req.summary.isFulfilled),
        completedCount: requirementsList.reduce((sum, req) => sum + req.summary.completedCount, 0),
        requiredCount: requirementsList.reduce((sum, req) => sum + req.summary.requiredUnits, 0)
    };

    // 构建 appliesTo（用户上下文）
    const appliesTo = {
        year: user.year,
        collegeId: user.college?.collegeId,
        majorId: user.majors[0]?.majorId, // 假设取第一个 major
        concentrationNames: user.majors[0]?.concentrationNames
    };

    // 组装完整响应
    const response: ProgramResponse = {
        semester: selectedSemester,
        programInfo: {
            _id: program._id,
            name: program.name,
            type: program.type,
            description: program.description,
            ...(program.type === "major" || program.type === "minor" 
                ? { colleges: program.colleges } 
                : { majors: program.majors })
        } as any, // 类型断言，因为 ProgramInfo 是联合类型
        summary: programSummary,
        appliesTo: appliesTo,
        requirementsList: requirementsList
    };

    return response;
};

const getRequirementIds = (user: User, program: ProgramData): string[] => {
    // TODO: 实现根据用户信息筛选 requirement sets
    return [];
};

/**
 * 构建单个 Requirement 的完整数据（包括 nodes 和 summary）
 */
const buildRequirement = async (
    requirementData: RequirementData,
    userCourses: RawUserCourse[],
    selectedSemester: string,
    allRequirementsData: RequirementData[]
): Promise<Requirement> => {
    
    // 1. 计算互斥的 requirement IDs（不在 overlap 列表里的其他 requirements）
    const overlapRequirementIds = requirementData.overlap || [];
    
    // 2. 构建 nodesById
    const nodesById: Record<string, Node> = {};
    
    // 用于累计 requirement 级别的统计
    let totalCompletedCount = 0;
    let totalInProgressCount = 0;
    let totalPlannedCount = 0;
    let totalSavedCount = 0;
    let totalFulfilledUnits = 0;
    let totalRequiredUnits = 0;
    
    for (const nodeData of requirementData.nodesData) {
        if (nodeData.type === "COURSE_SET") {
            // 计算 COURSE_SET node 的状态
            const result = await computeCourseSetNodeState(
                nodeData,
                userCourses,
                selectedSemester,
                requirementData._id,
                overlapRequirementIds
            );
            
            const courseSetNode: CourseSetNode = {
                nodeId: nodeData.nodeId,
                type: "COURSE_SET",
                title: nodeData.title,
                rule: nodeData.rule,
                options: result.courseOptions,
                nodeState: result.nodeState
            };
            
            nodesById[nodeData.nodeId] = courseSetNode;
            
            // 累计统计（对于 COURSE_SET，units 就是课程数）
            totalCompletedCount += result.nodeState.completedUsedOptionIds.length;
            totalInProgressCount += result.nodeState.inProgressUsedOptionIds.length;
            totalPlannedCount += result.nodeState.plannedUsedOptionIds.length;
            totalSavedCount += result.nodeState.savedUsedOptionIds.length;
            totalFulfilledUnits += result.nodeState.fulfilledCount;
            totalRequiredUnits += nodeData.rule.pick;
            
        } else if (nodeData.type === "GROUP") {
            // GROUP node 的处理：需要在所有子节点处理完后，从子节点状态计算父节点状态
            // 暂时先创建一个空的 GROUP node，稍后更新
            const groupNode: GroupNode = {
                nodeId: nodeData.nodeId,
                type: "GROUP",
                title: nodeData.title,
                rule: nodeData.rule,
                children: nodeData.children,
                nodeState: {
                    isFulfilled: false,
                    fulfilledCount: 0,
                    countedChildIds: []
                }
            };
            
            nodesById[nodeData.nodeId] = groupNode;
        }
    }
    
    // 3. 从叶子节点向上传播，计算 GROUP nodes 的状态
    propagateGroupNodeStates(nodesById, requirementData.rootNodeId);
    
    // 4. 计算 requirement summary
    const rootNode = nodesById[requirementData.rootNodeId];
    const isFulfilled = rootNode?.nodeState?.isFulfilled || false;
    
    const requirement: Requirement = {
        semester: selectedSemester,
        requirementInfo: {
            _id: requirementData._id,
            name: requirementData.name,
            description: requirementData.description,
            uiType: requirementData.uiType,
            programId: requirementData.programId,
            concentrationName: requirementData.concentrationName,
            overlap: requirementData.overlap
        },
        rootNodeId: requirementData.rootNodeId,
        nodesById: nodesById,
        summary: {
            isFulfilled,
            fulfilledUnits: totalFulfilledUnits,
            requiredUnits: totalRequiredUnits,
            completedCount: totalCompletedCount,
            inProgressCount: totalInProgressCount,
            plannedCount: totalPlannedCount,
            savedCount: totalSavedCount
        },
        progressVersion: "1.0.0" // 版本号
    };
    
    return requirement;
};

/**
 * 从叶子节点向上传播，计算 GROUP nodes 的状态
 * TODO: 实现完整的传播逻辑
 */
const propagateGroupNodeStates = (nodesById: Record<string, Node>, rootNodeId: string): void => {
    // 递归计算每个 GROUP node 的状态
    const computeGroupState = (nodeId: string): void => {
        const node = nodesById[nodeId];
        if (!node || node.type !== "GROUP") return;
        
        // 先递归计算所有子节点
        for (const childId of node.children) {
            const childNode = nodesById[childId];
            if (childNode?.type === "GROUP") {
                computeGroupState(childId);
            }
        }
        
        // 计算有多少子节点已满足
        const fulfilledChildren = node.children.filter(childId => {
            const childNode = nodesById[childId];
            return childNode?.nodeState?.isFulfilled || false;
        });
        
        node.nodeState.fulfilledCount = fulfilledChildren.length;
        node.nodeState.countedChildIds = fulfilledChildren;
        node.nodeState.isFulfilled = fulfilledChildren.length >= node.rule.pick;
    };
    
    computeGroupState(rootNodeId);
};

/**
 * 判断这个 program 是否是用户的 program
 */
const isUserProgram = (program: ProgramData, user: User): boolean => {
    if (program.type === "college") {
        return user.college?.collegeId === program._id;
    } else if (program.type === "major") {
        return user.majors.some(major => major.majorId === program._id);
    } else if (program.type === "minor") {
        return user.minors.some(minor => minor.minorId === program._id);
    }
    return false;
};

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

const computeCourseSetNodeState = async (
    nodeData: CourseSetNodeData, 
    userCourses: RawUserCourse[], 
    selectedSemester: string,
    requirementId: string,
    overlapRequirementIds: string[]
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
            overlapRequirementIds
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
                const conflictReqId = findConflictingRequirementId(userCourse, overlapRequirementIds);
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
    return course.enrollGroups?.some(group => group.locationConflicts) ?? false;
};

export const isAvailableInSemester = (course: Course, semester: string): boolean => {
    return course.enrollGroups?.some(group => 
        group.grpSmst.includes(semester)
    );
}

// ============= 辅助函数 =============

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

/**
 * 检查课程是否已被互斥的 requirement 使用
 */
const hasConflictingRequirement = (
    userCourse: RawUserCourse,
    currentRequirementId: string,
    overlapRequirementIds: string[]
): boolean => {
    return userCourse.usedInRequirements.some(reqId => {
        // 如果是当前 requirement，不算冲突
        if (reqId === currentRequirementId) return false;
        
        // 如果是允许 overlap 的 requirement，不算冲突
        if (overlapRequirementIds.includes(reqId)) return false;
        
        // 其他情况都算冲突
        return true;
    });
};

/**
 * 找到冲突的 requirement ID
 */
const findConflictingRequirementId = (
    userCourse: RawUserCourse,
    overlapRequirementIds: string[]
): string | undefined => {
    return userCourse.usedInRequirements.find(reqId => {
        return !overlapRequirementIds.includes(reqId);
    });
};