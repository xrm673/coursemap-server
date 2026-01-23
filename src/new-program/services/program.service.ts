import { UserModel } from "../../user/user.schema";
import { ProgramTreeModel } from "../program.schema";
import { ProgramData } from "../model/program.model";
import { User } from "../../user/user.model";
import { RawUserCourse } from "../../user/user.model";

import { ProgramResponse } from "../dto/program.dto";
import { RequirementTreeModel } from "../requirement.schema";
import { Requirement } from "../dto/requirements.dto";
import { Node, CourseSetNode, GroupNode } from "../dto/node.dto";
import { RequirementData } from "../model/requirement.model";
import { computeCourseSetNodeState } from "./course-allocation.service";
import { CourseOption, CourseTakingStatus } from "../dto/option.dto";

export const getProgram = async (programId: string, userId: string, selectedSemester: string): Promise<ProgramResponse> => {
    
    // 从数据库获取 program 信息
    const programDoc = await ProgramTreeModel.findById(programId);
    if (!programDoc) {
        throw new Error('Program not found');
    }

    // 从数据库获取 user 信息
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const program = programDoc.toObject() as ProgramData;

    // 根据user信息，从program的requirementSets中筛选出符合user的requirementSets
    const userRequirementIds = getRequirementIds(user, program);

    // 通过requirementids，从数据库获取requirements
    const requirementDocs = await RequirementTreeModel.find({ _id: { $in: userRequirementIds } });

    const requirementsData = requirementDocs.map(doc => doc.toObject()) as RequirementData[];

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
    // 获取匹配时使用的用户上下文
    const userContext = getUserContextForProgram(user, program);
    const appliesTo = {
        year: user.year,
        collegeId: user.college?.collegeId,
        majorId: userContext.majorId,
        concentrationNames: userContext.concentrationNames
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

/**
 * 根据用户信息筛选出适用的 requirement set
 * 
 * 匹配规则：
 * 1. 如果 program 某个维度是 dependent，则必须匹配该维度
 * 2. concentration 只在 program 是 user program 时才考虑
 * 3. 如果没有找到完全匹配的 set，返回第一个 set
 */
export const getRequirementIds = (user: User, program: ProgramData): string[] => {
    if (!program.requirementSets || program.requirementSets.length === 0) {
        return [];
    }

    // 判断这个 program 是否是用户的 program
    const isProgramForUser = isUserProgram(program, user);

    // 遍历所有 requirementSets，找到第一个匹配的
    for (const reqSet of program.requirementSets) {
        const { appliesTo } = reqSet;
        let matches = true;

        // 检查 year
        if (program.yearDependent && appliesTo.entryYear !== undefined) {
            if (appliesTo.entryYear !== user.year) {
                matches = false;
            }
        }

        // 检查 college
        if (program.collegeDependent && appliesTo.collegeId !== undefined) {
            if (appliesTo.collegeId !== user.college?.collegeId) {
                matches = false;
            }
        }

        // 检查 major
        if (program.majorDependent && appliesTo.majorId !== undefined) {
            const userHasMajor = user.majors.some(major => major.majorId === appliesTo.majorId);
            if (!userHasMajor) {
                matches = false;
            }
        }

        // 检查 concentration（只在 program 是 user program 时才检查）
        if (program.concentrationDependent && isProgramForUser && appliesTo.concentrationNames !== undefined) {
            // null 或 undefined 表示适用于任何 concentration（兜底 set）
            if (appliesTo.concentrationNames !== null) {
                // 检查用户是否有任何一个匹配的 concentration
                const userConcentrations = getUserConcentrations(user, program);
                const hasMatchingConcentration = appliesTo.concentrationNames.some(
                    reqConcentration => userConcentrations.includes(reqConcentration)
                );
                if (!hasMatchingConcentration) {
                    matches = false;
                }
            }
        }

        if (matches) {
            return reqSet.requirementIds;
        }
    }

    // 如果没有找到匹配的，返回第一个 set
    return program.requirementSets[0].requirementIds;
};

/**
 * 获取用户在特定 program 下的 concentration 名称
 */
const getUserConcentrations = (user: User, program: ProgramData): string[] => {
    if (program.type === 'major') {
        const userMajor = user.majors.find(m => m.majorId === program._id);
        return userMajor?.concentrationNames || [];
    } else if (program.type === 'minor') {
        const userMinor = user.minors.find(m => m.minorId === program._id);
        return userMinor?.concentrationNames || [];
    }
    return [];
};

/**
 * 获取用户在当前 program 下的上下文信息（majorId 和 concentrations）
 * 用于填充 appliesTo 字段
 */
const getUserContextForProgram = (
    user: User, 
    program: ProgramData
): { majorId?: string; concentrationNames?: string[] } => {
    if (program.type === 'major') {
        const userMajor = user.majors.find(m => m.majorId === program._id);
        return {
            majorId: userMajor?.majorId,
            concentrationNames: userMajor?.concentrationNames
        };
    } else if (program.type === 'minor') {
        const userMinor = user.minors.find(m => m.minorId === program._id);
        return {
            majorId: undefined,
            concentrationNames: userMinor?.concentrationNames
        };
    } else if (program.type === 'college') {
        // College 类型的 program，返回用户的第一个 major（如果有的话）
        return {
            majorId: user.majors[0]?.majorId,
            concentrationNames: undefined
        };
    }
    return {};
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
    
    // 1. 计算互斥的 requirement IDs（不在 conflictsWith 列表里的其他 requirements）
    const conflictsWithRequirementIds = requirementData.conflictsWith || [];
    
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
                conflictsWithRequirementIds
            );
            
            // 对 options 排序：生成排序种子，保证同一请求内稳定
            const sortSeed = `${requirementData._id}-${nodeData.nodeId}`;
            const sortedOptions = sortCourseOptions(result.courseOptions, sortSeed);
            
            const courseSetNode: CourseSetNode = {
                nodeId: nodeData.nodeId,
                type: "COURSE_SET",
                title: nodeData.title,
                rule: nodeData.rule,
                options: sortedOptions,
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
            conflictsWith: requirementData.conflictsWith
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

/**
 * 对 CourseOption 数组排序
 * 
 * 排序规则：
 * 1. IN_PROGRESS 最前
 * 2. available 的课程优先（isAvailable = true）
 * 3. 按 status 权重：SAVED > PLANNED > NOT_ON_SCHEDULE
 * 4. COMPLETED 最后（优先级最低）
 * 5. 同权重内用种子随机（保证同一请求内稳定）
 * 
 * @param options - 待排序的课程选项数组
 * @param seed - 随机种子，用于保证同一请求内排序稳定
 */
const sortCourseOptions = (options: CourseOption[], seed: string): CourseOption[] => {
    // 使用种子生成伪随机数生成器
    const seededRandom = createSeededRandom(seed);
    
    // 为每个 option 预生成一个随机值（用于 tie-breaking）
    const randomValues = new Map<string, number>();
    options.forEach(option => {
        randomValues.set(option.optionId, seededRandom());
    });
    
    return [...options].sort((a, b) => {
        const statusA = a.userState.status;
        const statusB = b.userState.status;
        
        // 1. IN_PROGRESS 最前
        if (statusA === "IN_PROGRESS" && statusB !== "IN_PROGRESS") return -1;
        if (statusB === "IN_PROGRESS" && statusA !== "IN_PROGRESS") return 1;
        
        // 2. COMPLETED 最后（优先级最低）
        if (statusA === "COMPLETED" && statusB !== "COMPLETED") return 1;
        if (statusB === "COMPLETED" && statusA !== "COMPLETED") return -1;
        
        // 3. isAvailable 优先
        if (a.userState.isAvailable !== b.userState.isAvailable) {
            return a.userState.isAvailable ? -1 : 1;
        }
        
        // 4. 按 status 权重排序
        const statusWeight: Record<CourseTakingStatus, number> = {
            "IN_PROGRESS": 0,    // 已在上面处理
            "SAVED": 1,
            "PLANNED": 2,
            "NOT_ON_SCHEDULE": 3,
            "COMPLETED": 4       // 已在上面处理
        };
        
        const weightDiff = statusWeight[statusA] - statusWeight[statusB];
        if (weightDiff !== 0) return weightDiff;
        
        // 5. 同权重用种子随机
        const randomA = randomValues.get(a.optionId) || 0;
        const randomB = randomValues.get(b.optionId) || 0;
        return randomA - randomB;
    });
};

/**
 * 创建基于种子的伪随机数生成器
 * 使用简单的线性同余生成器 (LCG) 算法
 * 
 * @param seed - 字符串种子
 * @returns 返回一个函数，每次调用返回 [0, 1) 之间的伪随机数
 */
const createSeededRandom = (seed: string) => {
    // 将字符串种子转换为数字 hash
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // 线性同余生成器
    return () => {
        hash = (hash * 9301 + 49297) % 233280;
        return hash / 233280;
    };
};