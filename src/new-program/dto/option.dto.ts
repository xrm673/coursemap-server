import { Course } from "../../course/course.model";

export type CourseOptionType = "COURSE" | "REPLACEMENT";

export interface CourseOption {
  optionId: string;
  type: CourseOptionType;

  /** 课程信息 */
  course: Course;

  /** 用户对这门课的状态 */
  userState: CourseUserState;

  /** 分配/计数解释 */
  allocation: Allocation;
}

export type CourseTakingStatus = "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "SAVED" | "NOT_ON_SCHEDULE";

/**
 * 课程选项排序策略
 * - PRIORITY: 按优先级排序（IN_PROGRESS > available > status权重 > COMPLETED）
 * - NONE: 不排序，保持原始顺序（字母顺序）
 */
export type SortStrategy = "PRIORITY" | "NONE";

export interface CourseUserStateBase {
    isScheduled: boolean;
    isAvailable: boolean;
    isSemesterAvailable: boolean;
    isLocationAvailable: boolean;
    status: CourseTakingStatus;
} 

export interface ScheduledCourseUserState extends CourseUserStateBase {
    isScheduled: true;
    status: "COMPLETED" | "IN_PROGRESS" | "PLANNED";
    credit: number;
    semester: string;
    sections: string[];
}

export interface NotScheduledCourseUserState extends CourseUserStateBase {
    isScheduled: false;
    status: "SAVED" | "NOT_ON_SCHEDULE";
}

export type CourseUserState = ScheduledCourseUserState | NotScheduledCourseUserState;

export type Allocation =
  | {
      /** 这门课在当前 option 所属的 COURSE_SET node 下是否被计数 */
      isCountedHere: true;
    }
  | {
      isCountedHere: false;
      /** 如果没被计数，原因是什么（可以多条） */
      notCountedReasons: AllocationBlock[];
    };

export interface AllocationBlock {
  reason:
    | "NOT_ON_SCHEDULE"
    | "OVER_LIMIT"
    | "ALREADY_COUNTED_ELSEWHERE";
  
  /** 如果 reason 是 ALREADY_COUNTED_ELSEWHERE，则需要提供以下信息 */
  requirementId?: string;
  nodeId?: string;
}