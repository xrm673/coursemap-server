export interface RequirementData {
    _id: string;
    name: string;
    description: string[];
    uiType: "LIST" | "GROUP" | "OPTION";
    programId: string;
    concentrationName?: string;
    overlap: string[];
    rootNodeId: string;
    nodesData: NodeData[];
}

type NodeType = "GROUP" | "COURSE_SET";

interface NodeDataBase {
  nodeId: string;
  type: NodeType;
  title: string;

  /** 满足 N 个（N 的单位由 type 决定） */
  rule: {
    pick: number;
  };
}

/** GROUP: 在 children（子组）里 pick N 个 */
interface GroupNodeData extends NodeDataBase {
  type: "GROUP";
  children: string[];
}

/** COURSE_SET: 在课程 options 里 pick N 个 */
export interface CourseSetNodeData extends NodeDataBase {
  type: "COURSE_SET";
  options: string[];
  courseNotes: CourseNote[];
}

interface CourseNote {
    courseId: string;
    grpIdentifierArray?: string[];
    noteForRequirement?: string;
    recommendedByDepartment?: boolean;
}

export type NodeData = GroupNodeData | CourseSetNodeData;