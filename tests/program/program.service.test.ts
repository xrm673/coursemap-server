import {
  compareSemester,
  isPriorSemester,
  getCourseOptionId,
  getCourseStatus,
  findMatchingUserCourse,
} from '../../src/new-program/program.service';
import { Course, CourseWithTopic } from '../../src/course/course.model';
import { RawUserCourse } from '../../src/user/user.model';

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
      const course = { _id: 'COMS3134' } as Course;
      const matched = findMatchingUserCourse(course, userCourses);
      expect(matched).toBeDefined();
      expect(matched?._id).toBe('COMS3134');
    });

    test('应该找到有 grpIdentifier 的课程', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_001',
      } as unknown as CourseWithTopic;
      const matched = findMatchingUserCourse(courseWithTopic, userCourses);
      expect(matched).toBeDefined();
      expect(matched?.grpIdentifier).toBe('COMS3998_001');
    });

    test('应该区分不同的 grpIdentifier', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_002',
      } as unknown as CourseWithTopic;
      const matched = findMatchingUserCourse(courseWithTopic, userCourses);
      expect(matched).toBeDefined();
      expect(matched?.grpIdentifier).toBe('COMS3998_002');
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
      const course = { _id: 'COMS3261' } as Course;
      const userCourses = [mockUserCourses.saved_INFO4210];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('SAVED');
      expect(isScheduled).toBe(false);
    });

    test('课程在当前学期应该返回 IN_PROGRESS', () => {
      const course = { _id: 'COMS4118' } as Course;
      const userCourses = [mockUserCourses.inProgress_INFO2950];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('IN_PROGRESS');
      expect(isScheduled).toBe(true);
    });

    test('课程在之前的学期应该返回 COMPLETED', () => {
      const course = { _id: 'COMS3134' } as Course;
      const userCourses = [mockUserCourses.completed_CS1110];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('COMPLETED');
      expect(isScheduled).toBe(true);
    });

    test('课程在未来的学期应该返回 PLANNED', () => {
      const course = { _id: 'COMS4156' } as Course;
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
      const course = { _id: 'COMS1004' } as Course;
      const userCourses = [mockUserCourses.completed_unspecified];
      const [status, isScheduled] = getCourseStatus(course, userCourses, selectedSemester);
      expect(status).toBe('COMPLETED');
      expect(isScheduled).toBe(true);
    });
  });
});
