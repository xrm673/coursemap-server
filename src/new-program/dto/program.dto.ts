import { Requirement } from "./requirements.dto";

export interface ProgramResponse {
    semester: string;
    programInfo: ProgramInfo;
    summary: ProgramSummary;
    appliesTo: UserContext;
    requirementsList: Requirement[];
}

interface ProgramInfoBase {
    _id: string;
    name: string;
    type: "major" | "minor" | "college";
    description?: string;
}

interface MajorInfo extends ProgramInfoBase {
    type: "major";
    colleges: Array<CollegeInProgram>;
}

interface MinorInfo extends ProgramInfoBase {
    type: "minor";
    colleges: Array<CollegeInProgram>;
}

interface CollegeInfo extends ProgramInfoBase {
    type: "college";
    majors: MajorInCollege[];
}

interface MajorInCollege {
    majorId: string;
    name: string;
}

interface CollegeInProgram {
    collegeId: string;
    name: string;
}

type ProgramInfo = MajorInfo | MinorInfo | CollegeInfo;

interface ProgramSummary {
    isUserProgram: boolean;
    isFulfilled: boolean;
    completedCount: number;
    requiredCount: number;
}

interface UserContext {
    year?: string;
    collegeId?: string;
    majorId?: string;
    concentrationNames?: string[];
}