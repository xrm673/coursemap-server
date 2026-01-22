import {
  compareSemester,
  isPriorSemester,
  getCourseOptionId,
  getCourseStatus,
  findMatchingUserCourse,
  getRequirementIds,
} from '../../src/new-program/program.service';
import { Course, CourseWithTopic } from '../../src/course/course.model';
import { RawUserCourse, User } from '../../src/user/user.model';
import { ProgramData } from '../../src/new-program/model/program.model';

// ============= Test Fixtures =============

/**
 * 可复用的 RawUserCourse fixtures
 * 模拟不同状态和学期的用户课程
 */
const createUserCourse = (
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
const mockUserCourses = {
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
const userCourseSets = {
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
const mockUsers = {
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
const mockPrograms = {
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
        requirementIds: ['req_cs_2023_seas_ai'],
      },
      {
        appliesTo: { entryYear: '2023', collegeId: 'seas', concentrationNames: null },
        requirementIds: ['req_cs_2023_seas_general'],
      },
      {
        appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: null },
        requirementIds: ['req_cs_2023_arts_general'],
      },
      {
        appliesTo: { entryYear: '2024', collegeId: 'seas', concentrationNames: null },
        requirementIds: ['req_cs_2024_seas_general'],
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
        requirementIds: ['req_is_2023'],
      },
      {
        appliesTo: { entryYear: '2024' },
        requirementIds: ['req_is_2024'],
      },
      {
        appliesTo: {},
        requirementIds: ['req_is_default'],
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
        requirementIds: ['req_math_universal'],
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
        requirementIds: ['req_arts_2023'],
      },
      {
        appliesTo: { entryYear: '2024' },
        requirementIds: ['req_arts_2024'],
      },
    ],
  } as ProgramData,
};

describe('Semester Utilities', () => {
  describe('compareSemester', () => {
    test('应该正确比较同一年的不同学期', () => {
      // WI < SP < SU < FA
      expect(compareSemester('WI24', 'SP24')).toBeLessThan(0);
      expect(compareSemester('SP24', 'SU24')).toBeLessThan(0);
      expect(compareSemester('SU24', 'FA24')).toBeLessThan(0);
    });

    test('应该正确比较不同年的学期', () => {
      expect(compareSemester('FA23', 'SP24')).toBeLessThan(0);
      expect(compareSemester('WI25', 'FA24')).toBeGreaterThan(0);
      expect(compareSemester('SP23', 'SP24')).toBeLessThan(0);
    });

    test('应该识别相同的学期', () => {
      expect(compareSemester('FA24', 'FA24')).toBe(0);
      expect(compareSemester('SP25', 'SP25')).toBe(0);
    });

    test('应该正确处理跨年的学期比较', () => {
      expect(compareSemester('FA23', 'WI24')).toBeLessThan(0);
      expect(compareSemester('SU24', 'FA24')).toBeLessThan(0);
    });
  });

  describe('isPriorSemester', () => {
    test('unspecified 应该总是返回 true', () => {
      expect(isPriorSemester('unspecified', 'FA24')).toBe(true);
      expect(isPriorSemester('unspecified', 'SP25')).toBe(true);
    });

    test('应该正确判断之前的学期', () => {
      expect(isPriorSemester('FA23', 'SP24')).toBe(true);
      expect(isPriorSemester('WI24', 'FA24')).toBe(true);
      expect(isPriorSemester('SP23', 'FA24')).toBe(true);
    });

    test('应该正确判断未来的学期', () => {
      expect(isPriorSemester('SP25', 'FA24')).toBe(false);
      expect(isPriorSemester('FA24', 'SP24')).toBe(false);
    });

    test('应该正确判断相同的学期', () => {
      expect(isPriorSemester('FA24', 'FA24')).toBe(false);
      expect(isPriorSemester('SP25', 'SP25')).toBe(false);
    });

    test('应该正确处理同一年不同季节', () => {
      expect(isPriorSemester('WI24', 'SP24')).toBe(true);
      expect(isPriorSemester('SP24', 'SU24')).toBe(true);
      expect(isPriorSemester('SU24', 'FA24')).toBe(true);
      expect(isPriorSemester('FA24', 'WI24')).toBe(false);
    });
  });
});

describe('Course Identification', () => {
  describe('getCourseOptionId', () => {
    test('普通课程应该返回 courseId', () => {
      const course = { _id: 'COMS3134' } as Course;
      expect(getCourseOptionId(course)).toBe('COMS3134');
    });

    test('有 topic 的课程应该返回 courseId_grpIdentifier', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_001',
      } as unknown as CourseWithTopic;
      expect(getCourseOptionId(courseWithTopic)).toBe('COMS3998_COMS3998_001');
    });

    test('有 grpIdentifier 但为空的课程应该返回 courseId', () => {
      const course = {
        _id: 'COMS3157',
        grpIdentifier: '',
      } as unknown as CourseWithTopic;
      expect(getCourseOptionId(course)).toBe('COMS3157');
    });
  });
});

describe('Course Matching', () => {
  describe('findMatchingUserCourse', () => {
    // 使用预定义的课程集合
    const userCourses = userCourseSets.withTopics;

    test('应该找到普通课程', () => {
      // withTopics 集合中没有普通课程，使用 basic 集合
      const basicCourses = userCourseSets.basic;
      const course = { _id: 'CS1110' } as Course;
      const matched = findMatchingUserCourse(course, basicCourses);
      expect(matched).toBeDefined();
      expect(matched?._id).toBe('CS1110');
    });

    test('应该找到有 grpIdentifier 的课程', () => {
      const courseWithTopic = {
        _id: 'INFO4940',
        grpIdentifier: 'AI Product Design',
      } as unknown as CourseWithTopic;
      const matched = findMatchingUserCourse(courseWithTopic, userCourses);
      expect(matched).toBeDefined();
      expect(matched?.grpIdentifier).toBe('AI Product Design');
    });

    test('应该区分不同的 grpIdentifier', () => {
      const courseWithTopic = {
        _id: 'COMM4940',
        grpIdentifier: 'Comm Lab',
      } as unknown as CourseWithTopic;
      const matched = findMatchingUserCourse(courseWithTopic, userCourses);
      expect(matched).toBeDefined();
      expect(matched?.grpIdentifier).toBe('Comm Lab');
    });

    test('应该在找不到课程时返回 undefined', () => {
      const course = { _id: 'COMS4118' } as Course;
      const matched = findMatchingUserCourse(course, userCourses);
      expect(matched).toBeUndefined();
    });

    test('应该在 grpIdentifier 不匹配时返回 undefined', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_999',
      } as unknown as CourseWithTopic;
      const matched = findMatchingUserCourse(courseWithTopic, userCourses);
      expect(matched).toBeUndefined();
    });
  });
});

describe('Course Status', () => {
  describe('getCourseStatus', () => {
    const selectedSemester = 'FA24';

    test('课程不在 userCourses 应该返回 NOT_ON_SCHEDULE', () => {
      const course = { _id: 'COMS9999' } as Course; // 不存在的课程
      const userCourses: RawUserCourse[] = [];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('NOT_ON_SCHEDULE');
      expect(isScheduled).toBe(false);
    });

    test('课程在 userCourses 但未 scheduled 应该返回 SAVED', () => {
      const course = { _id: 'INFO4210' } as Course;
      const userCourses = [mockUserCourses.saved_INFO4210];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('SAVED');
      expect(isScheduled).toBe(false);
    });

    test('课程在当前学期应该返回 IN_PROGRESS', () => {
      const course = { _id: 'INFO2950' } as Course;
      const userCourses = [mockUserCourses.inProgress_INFO2950];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('IN_PROGRESS');
      expect(isScheduled).toBe(true);
    });

    test('课程在之前的学期应该返回 COMPLETED', () => {
      const course = { _id: 'CS1110' } as Course;
      const userCourses = [mockUserCourses.completed_CS1110];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('COMPLETED');
      expect(isScheduled).toBe(true);
    });

    test('课程在未来的学期应该返回 PLANNED', () => {
      const course = { _id: 'CS3110' } as Course;
      const userCourses = [mockUserCourses.planned_CS3110];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('PLANNED');
      expect(isScheduled).toBe(true);
    });

    test('应该正确处理有 grpIdentifier 的课程', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_001',
      } as unknown as CourseWithTopic;
      // 创建一个在 SP24 (之前学期) 的 topic 课程
      const userCourses = [
        createUserCourse('COMS3998', 'SP24', {
          grpIdentifier: 'COMS3998_001',
        }),
      ];
      const [status, isScheduled] = getCourseStatus(courseWithTopic, userCourses, selectedSemester);
      expect(status).toBe('COMPLETED');
      expect(isScheduled).toBe(true);
    });

    test('unspecified semester 应该被视为 COMPLETED', () => {
      const course = { _id: 'CS1112' } as Course;
      const userCourses = [mockUserCourses.completed_unspecified];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('COMPLETED');
      expect(isScheduled).toBe(true);
    });
  });
});

describe('Requirement Set Matching', () => {
  describe('getRequirementIds', () => {
    test('应该匹配 year + college + concentration', () => {
      // 2023 SEAS CS major with AI concentration
      const user = mockUsers.seas_cs_2023_ai;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_cs_2023_seas_ai']);
    });

    test('应该匹配 year + college (concentration 为 null 的兜底 set)', () => {
      // 2023 SEAS CS major，但没有 concentration，应该匹配兜底 set
      const user = {
        ...mockUsers.seas_cs_2023_ai,
        majors: [{ majorId: 'cs', name: 'CS', concentrationNames: [] }],
      } as unknown as User;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_cs_2023_seas_general']);
    });

    test('应该匹配不同 college 的 requirement set', () => {
      // 2023 Arts CS major
      const user = mockUsers.arts_cs_2023_multi;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_cs_2023_arts_general']);
    });

    test('应该只根据 year 匹配（不 dependent 其他维度）', () => {
      // IS major 只 year dependent
      const user = mockUsers.cals_is_2024;
      const program = mockPrograms.is_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_is_2024']);
    });

    test('应该匹配无任何 dependency 的 program', () => {
      // Math minor 没有任何 dependency
      const user = mockUsers.seas_cs_math_minor;
      const program = mockPrograms.math_minor;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_math_universal']);
    });

    test('应该在找不到匹配时返回第一个 set', () => {
      // 2025 年的用户，但没有对应的 year-specific set
      // 会匹配到 appliesTo: {} 的 default set
      const user = {
        ...mockUsers.seas_cs_2023_ai,
        year: '2025',
      } as unknown as User;
      const program = mockPrograms.is_major;
      const reqIds = getRequirementIds(user, program);
      // 在这个例子中，会匹配到第三个 set (appliesTo: {})
      expect(reqIds).toEqual(['req_is_default']);
    });

    test('应该处理空的 requirementSets', () => {
      const user = mockUsers.seas_cs_2023_ai;
      const program = {
        ...mockPrograms.cs_major,
        requirementSets: [],
      } as ProgramData;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual([]);
    });

    test('concentration 只在 user program 时才检查', () => {
      // 用户查看不是自己的 major 时，不应该检查 concentration
      const user = mockUsers.cals_is_2024; // IS major
      const program = mockPrograms.cs_major; // CS major (not user's)
      const reqIds = getRequirementIds(user, program);
      // 应该匹配到 2024 SEAS 的 general set（因为 user 是 2024 年，但 college 不匹配）
      // 或者第一个 set（因为没有完全匹配）
      expect(reqIds).toBeDefined();
    });

    test('应该匹配 college requirements (year dependent)', () => {
      // Arts college，2023 年入学
      const user = mockUsers.arts_cs_2023_multi;
      const program = mockPrograms.liberal_arts;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_arts_2023']);
    });

    test('应该匹配多个 concentrations 中的任意一个', () => {
      // 用户有 Systems 和 AI 两个 concentrations
      const user = mockUsers.arts_cs_2023_multi; // 有 Systems 和 AI
      const program = {
        ...mockPrograms.cs_major,
        requirementSets: [
          {
            appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: ['Systems'] },
            requirementIds: ['req_cs_2023_arts_systems'],
          },
          {
            appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: null },
            requirementIds: ['req_cs_2023_arts_general'],
          },
        ],
      } as ProgramData;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['req_cs_2023_arts_systems']);
    });
  });
});
