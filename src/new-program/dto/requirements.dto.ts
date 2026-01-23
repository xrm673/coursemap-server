import { Node } from "./node.dto";

export interface Requirement {
    semester: string;
    requirementInfo: RequirementInfo;
    rootNodeId: string;
    nodesById: Record<string, Node>;
    summary: RequirementSummary;
    progressVersion: string;
}

interface RequirementInfo {
    _id: string;
    name: string;
    description: string[];
    uiType: "LIST" | "GROUP" | "OPTION";
    programId: string;
    concentrationName?: string;
    conflictsWith: string[];
}

interface RequirementSummary {
    isFulfilled: boolean;

    fulfilledUnits: number;     // 已满足“单位”（可能是门数/组数）
    requiredUnits: number;
  
    completedCount: number;
    inProgressCount: number;
    plannedCount: number;
    savedCount: number;
}