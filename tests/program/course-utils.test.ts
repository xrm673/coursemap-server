import {
  compareSemester,
  isPriorSemester,
  getCourseOptionId,
  findMatchingUserCourse,
  isAvailableInLocation,
  isAvailableInSemester,
} from '../../src/new-program/course-utils';
import { Course, CourseWithTopic } from '../../src/course/course.model';
import { createUserCourse, userCourseSets } from './test-fixtures';

describe('Course Utils - Semester Utilities', () => {
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

describe('Course Utils - Course Identification', () => {
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

describe('Course Utils - Course Matching', () => {
  describe('findMatchingUserCourse', () => {
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

describe('Course Utils - Availability', () => {
  describe('isAvailableInLocation', () => {
    test('课程没有 locationConflicts 应该返回 true', () => {
      const course = {
        _id: 'CS1110',
        enrollGroups: [
          { grpIdentifier: '001', locationConflicts: false },
          { grpIdentifier: '002', locationConflicts: false },
        ],
      } as unknown as Course;
      expect(isAvailableInLocation(course)).toBe(true);
    });

    test('课程有任何一个 enrollGroup 有 locationConflicts 应该返回 false', () => {
      const course = {
        _id: 'CS1110',
        enrollGroups: [
          { grpIdentifier: '001', locationConflicts: false },
          { grpIdentifier: '002', locationConflicts: true },
        ],
      } as unknown as Course;
      expect(isAvailableInLocation(course)).toBe(false);
    });

    test('课程没有 enrollGroups 应该返回 true', () => {
      const course = {
        _id: 'CS1110',
        enrollGroups: undefined,
      } as unknown as Course;
      expect(isAvailableInLocation(course)).toBe(true);
    });
  });

  describe('isAvailableInSemester', () => {
    test('课程在指定学期可用应该返回 true', () => {
      const course = {
        _id: 'CS1110',
        enrollGroups: [
          { grpIdentifier: '001', grpSmst: ['FA24', 'SP25'] },
          { grpIdentifier: '002', grpSmst: ['FA24'] },
        ],
      } as unknown as Course;
      expect(isAvailableInSemester(course, 'FA24')).toBe(true);
    });

    test('课程在指定学期不可用应该返回 false', () => {
      const course = {
        _id: 'CS1110',
        enrollGroups: [
          { grpIdentifier: '001', grpSmst: ['FA24', 'SP25'] },
          { grpIdentifier: '002', grpSmst: ['FA24'] },
        ],
      } as unknown as Course;
      expect(isAvailableInSemester(course, 'SU25')).toBe(false);
    });
  });
});
