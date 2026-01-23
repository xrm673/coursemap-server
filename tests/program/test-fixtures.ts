import { RawUserCourse, User } from '../../src/user/user.model';
import { ProgramData } from '../../src/new-program/model/program.model';

// ============= Test Fixtures =============

/**
 * 可复用的 RawUserCourse fixtures
 * 模拟不同状态和学期的用户课程
 */
export const createUserCourse = (
  courseId: string,
  semester: string,
  options?: Partial<RawUserCourse>
): RawUserCourse => ({
  _id: courseId,
  isScheduled: true,
  usedInRequirements: [],
  semester,
  credit: 3,
  sections: ['001'],
  ...options,
});

// 常用的测试课程
export const mockUserCourses = {
  // 已完成的课程（在 FA24 之前）
  completed_CS1110: createUserCourse('CS1110', 'FA23'),
  completed_unspecified: createUserCourse('CS1112', 'unspecified'),
  
  // 当前学期的课程（FA24）
  inProgress_INFO2950: createUserCourse('INFO2950', 'FA24'),
  
  // 未来学期的课程
  planned_CS3110: createUserCourse('CS3110', 'SP25'),
  planned_CS2800: createUserCourse('CS2800', 'FA25'),
  
  // 收藏但未安排的课程
  saved_INFO4210: createUserCourse('INFO4210', '', { isScheduled: false }),
  
  // 有 topic 的课程（不同 grpIdentifier）
  topic_INFO4940_AIProductDesign: createUserCourse('INFO4940', 'SP25', {
    grpIdentifier: 'AI Product Design',
  }),
  topic_COMM4940_CommLab: createUserCourse('COMM4940', 'SP25', {
    grpIdentifier: 'Comm Lab',
  }),
  
  // 已被使用的课程
  used_CS2110: createUserCourse('CS2110', 'SP24', {
    usedInRequirements: ['cs1'],
  }),
  
  // 已被多个 requirements 使用
  multiUsed_MATH2210: createUserCourse('MATH2210', 'FA23', {
    usedInRequirements: ['cs1', 'math1'],
  }),
};

// 常用的课程集合
export const userCourseSets = {
  // 基础集合：包含已完成、进行中、计划的课程
  basic: [
    mockUserCourses.completed_CS1110,
    mockUserCourses.inProgress_INFO2950,
    mockUserCourses.planned_CS3110,
  ],
  
  // 包含 topic 课程
  withTopics: [
    mockUserCourses.topic_INFO4940_AIProductDesign,
    mockUserCourses.topic_COMM4940_CommLab,
  ],
  
  // 包含已使用的课程
  withUsed: [
    mockUserCourses.completed_CS1110,
    mockUserCourses.used_CS2110,
    mockUserCourses.multiUsed_MATH2210,
  ],
  
  // 混合状态
  mixed: [
    mockUserCourses.completed_CS1110,
    mockUserCourses.completed_unspecified,
    mockUserCourses.inProgress_INFO2950,
    mockUserCourses.planned_CS3110,
    mockUserCourses.saved_INFO4210,
  ],
};

// Mock Users
export const mockUsers = {
  // 2023 SEAS CS major with AI concentration
  seas_cs_2023_ai: {
    _id: 'user1',
    year: '2023',
    college: { collegeId: 'seas', name: 'Engineering' },
    majors: [
      {
        majorId: 'cs',
        name: 'Computer Science',
        concentrationNames: ['AI'],
      },
    ],
    minors: [],
    courses: [],
  } as unknown as User,

  // 2024 CALS IS major, no concentration
  cals_is_2024: {
    _id: 'user2',
    year: '2024',
    college: { collegeId: 'cals', name: 'Agriculture and Life Sciences' },
    majors: [
      {
        majorId: 'is',
        name: 'Information Science',
        concentrationNames: [],
      },
    ],
    minors: [],
    courses: [],
  } as unknown as User,

  // 2023 Arts CS major with multiple concentrations
  arts_cs_2023_multi: {
    _id: 'user3',
    year: '2023',
    college: { collegeId: 'arts', name: 'Arts and Sciences' },
    majors: [
      {
        majorId: 'cs',
        name: 'Computer Science',
        concentrationNames: ['Systems', 'AI'],
      },
    ],
    minors: [],
    courses: [],
  } as unknown as User,

  // User with CS major and Math minor
  seas_cs_math_minor: {
    _id: 'user4',
    year: '2024',
    college: { collegeId: 'seas', name: 'Engineering' },
    majors: [
      {
        majorId: 'cs',
        name: 'Computer Science',
        concentrationNames: [],
      },
    ],
    minors: [
      {
        minorId: 'math',
        name: 'Mathematics',
        concentrationNames: [],
      },
    ],
    courses: [],
  } as unknown as User,
};

// Mock Programs
export const mockPrograms = {
  // CS Major - year and college dependent, has concentrations
  cs_major: {
    _id: 'cs',
    name: 'Computer Science',
    type: 'major',
    yearDependent: true,
    majorDependent: false,
    collegeDependent: true,
    concentrationDependent: true,
    colleges: [
      { collegeId: 'seas', name: 'Engineering' },
      { collegeId: 'arts', name: 'Arts and Sciences' },
    ],
    requirementSets: [
      {
        appliesTo: { entryYear: '2023', collegeId: 'seas', concentrationNames: ['AI'] },
        requirementIds: ['cs1', 'cs2', 'cs3'], // AI concentration requirements
      },
      {
        appliesTo: { entryYear: '2023', collegeId: 'seas', concentrationNames: null },
        requirementIds: ['cs1', 'cs2', 'cs4'], // SEAS general requirements
      },
      {
        appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: null },
        requirementIds: ['cs1', 'cs2', 'cs5'], // Arts general requirements
      },
      {
        appliesTo: { entryYear: '2024', collegeId: 'seas', concentrationNames: null },
        requirementIds: ['cs6', 'cs7', 'cs8'], // 2024 SEAS requirements
      },
    ],
  } as ProgramData,

  // IS Major - only year dependent
  is_major: {
    _id: 'is',
    name: 'Information Science',
    type: 'major',
    yearDependent: true,
    majorDependent: false,
    collegeDependent: false,
    concentrationDependent: false,
    colleges: [{ collegeId: 'cals', name: 'CALS' }],
    requirementSets: [
      {
        appliesTo: { entryYear: '2023' },
        requirementIds: ['is1', 'is2', 'is3'],
      },
      {
        appliesTo: { entryYear: '2024' },
        requirementIds: ['is4', 'is5', 'is6'],
      },
      {
        appliesTo: {},
        requirementIds: ['is7', 'is8'], // default fallback
      },
    ],
  } as ProgramData,

  // Math Minor - no dependencies
  math_minor: {
    _id: 'math',
    name: 'Mathematics',
    type: 'minor',
    yearDependent: false,
    majorDependent: false,
    collegeDependent: false,
    concentrationDependent: false,
    colleges: [],
    requirementSets: [
      {
        appliesTo: {},
        requirementIds: ['math1', 'math2'],
      },
    ],
  } as ProgramData,

  // Liberal Arts - college requirements
  liberal_arts: {
    _id: 'arts',
    name: 'College of Arts and Sciences',
    type: 'college',
    yearDependent: true,
    majorDependent: false,
    collegeDependent: false,
    concentrationDependent: false,
    majors: [],
    requirementSets: [
      {
        appliesTo: { entryYear: '2023' },
        requirementIds: ['arts1', 'arts2', 'arts3'],
      },
      {
        appliesTo: { entryYear: '2024' },
        requirementIds: ['arts4', 'arts5', 'arts6'],
      },
    ],
  } as ProgramData,
};
