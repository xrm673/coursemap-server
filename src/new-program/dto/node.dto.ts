import { CourseOption } from "./option.dto";

export type NodeType = "GROUP" | "COURSE_SET";

export interface NodeBase {
  nodeId: string;
  type: NodeType;
  title: string;

  /** 满足 N 个（N 的单位由 type 决定） */
  rule: {
    pick: number;
  };
  
  nodeState?: NodeStateBase;
}

export interface NodeStateBase {
  isFulfilled: boolean;

  /** 已满足/已计入的数量：GROUP=子组数；COURSE_SET=课程(选项)数 */
  fulfilledCount: number;
}

/** GROUP: 在 children（子组）里 pick N 个 */
export interface GroupNode extends NodeBase {
  type: "GROUP";
  children: string[];
  nodeState: NodeStateBase & {
    /** 哪些 child 被计入本节点的 fulfilled_count（通常是满足的子组） */
    countedChildIds: string[];
  };
}

/** COURSE_SET: 在课程 options 里 pick N 个 */
export interface CourseSetNode extends NodeBase {
  type: "COURSE_SET";
  options: CourseOption[];

  nodeState: NodeStateBase & {
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

export type Node = GroupNode | CourseSetNode;