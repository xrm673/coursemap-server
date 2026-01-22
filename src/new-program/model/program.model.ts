interface ProgramDataBase {
    _id: string;
    name: string;
    type: "major" | "minor" | "college";
    description?: string;
    yearDependent: boolean;
    majorDependent: boolean;
    collegeDependent: boolean;
    concentrationDependent: boolean;
    requirementSets: Array<RequirementSet>;
}

interface RequirementSet {
    appliesTo: {entryYear?: string, collegeId?: string, majorId?: string, concentrationNames?: string[]};
    requirementIds: string[];
}

interface MajorData extends ProgramDataBase {
    type: "major";
    colleges: Array<CollegeInProgram>;
}

interface MinorData extends ProgramDataBase {
    type: "minor";
    colleges: Array<CollegeInProgram>;
}

interface CollegeData extends ProgramDataBase {
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

export type ProgramData = MajorData | MinorData | CollegeData;