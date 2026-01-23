import { getCourseStatus } from '../../src/new-program/services/course-allocation.service';
import { Course, CourseWithTopic } from '../../src/course/course.model';
import { RawUserCourse } from '../../src/user/user.model';
import { createUserCourse, mockUserCourses } from './test-fixtures';

describe('Course Allocation Service - Course Status', () => {
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

    test('应该区分不同 grpIdentifier 的课程', () => {
      const courseWithTopic = {
        _id: 'COMS3998',
        grpIdentifier: 'COMS3998_001',
      } as unknown as CourseWithTopic;
      // userCourse 有不同的 grpIdentifier
      const userCourses = [
        createUserCourse('COMS3998', 'FA24', {
          grpIdentifier: 'COMS3998_002',
        }),
      ];
      const [status, isScheduled] = getCourseStatus(courseWithTopic, userCourses, selectedSemester);
      expect(status).toBe('NOT_ON_SCHEDULE');
      expect(isScheduled).toBe(false);
    });
  });
});
