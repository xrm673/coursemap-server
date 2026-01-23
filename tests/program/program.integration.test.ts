import { getProgram } from '../../src/new-program/program.service';
import { ProgramTreeModel } from '../../src/new-program/program.schema';
import { RequirementTreeModel } from '../../src/new-program/requirement.schema';
import { UserModel } from '../../src/user/user.schema';
import { ProgramData } from '../../src/new-program/model/program.model';
import { RequirementData } from '../../src/new-program/model/requirement.model';

// Mock the database models
jest.mock('../../src/new-program/program.schema');
jest.mock('../../src/new-program/requirement.schema');
jest.mock('../../src/user/user.schema');
jest.mock('../../src/course/course.service');

// Mock getCoursesByIds
import * as courseService from '../../src/course/course.service';
const mockGetCoursesByIds = courseService.getCoursesByIds as jest.MockedFunction<typeof courseService.getCoursesByIds>;

describe('Program Integration Tests - getProgram', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('conflictsWith Requirements - Course Allocation', () => {
    test('课程在两个 conflictsWith（互斥）的 requirements 中只在第一个被计数', async () => {
      // ========== 1. 准备测试数据 ==========
      
      // Program: CS major
      const mockProgram: ProgramData = {
        _id: 'cs',
        name: 'Computer Science',
        type: 'major',
        yearDependent: false,
        majorDependent: false,
        collegeDependent: false,
        concentrationDependent: false,
        colleges: [{ collegeId: 'seas', name: 'Engineering' }],
        requirementSets: [
          {
            appliesTo: {},
            requirementIds: ['cs1', 'cs2'], // 两个 requirements
          },
        ],
      };

      // Requirement 1: Core - 需要 2 门核心课程
      const mockRequirement1: RequirementData = {
        _id: 'cs1',
        uiType: 'GROUP',
        programId: 'cs',
        name: 'Core Requirements',
        description: ['Core courses for CS major'],
        conflictsWith: ['cs2'], // ✅ 与 cs2 conflictsWith
        rootNodeId: 'cs1_root',
        nodesData: [
          {
            nodeId: 'cs1_root',
            type: 'GROUP',
            title: 'Core',
            rule: { pick: 1 }, // 只有 1 个 child
            children: ['cs1_courses'],
          },
          {
            nodeId: 'cs1_courses',
            type: 'COURSE_SET',
            title: 'Core Courses',
            rule: { pick: 2 },
            options: ['CS1110', 'CS2110', 'CS3110'], // 包含 CS2110
            courseNotes: [],
          },
        ],
      };

      // Requirement 2: Electives - 需要 2 门选修课
      const mockRequirement2: RequirementData = {
        _id: 'cs2',
        uiType: 'GROUP',
        programId: 'cs',
        name: 'Electives',
        description: ['Elective courses for CS major'],
        conflictsWith: ['cs1'], // ✅ 与 cs1 conflictsWith（互斥）
        rootNodeId: 'cs2_root',
        nodesData: [
          {
            nodeId: 'cs2_root',
            type: 'GROUP',
            title: 'Electives',
            rule: { pick: 1 }, // 只有 1 个 child
            children: ['cs2_courses'],
          },
          {
            nodeId: 'cs2_courses',
            type: 'COURSE_SET',
            title: 'Elective Courses',
            rule: { pick: 2 },
            options: ['CS2110', 'CS3410', 'CS4410'], // 也包含 CS2110
            courseNotes: [],
          },
        ],
      };

      // User: 已完成 CS1110, CS2110, CS3410
      const mockUser = {
        _id: 'user1',
        year: '2023',
        college: { collegeId: 'seas', name: 'Engineering' },
        majors: [{ majorId: 'cs', name: 'Computer Science', concentrationNames: [] }],
        minors: [],
        courses: [
          {
            _id: 'CS1110',
            isScheduled: true,
            semester: 'FA23',
            credit: 4,
            sections: ['001'],
            usedInRequirements: [], // 初始为空
          },
          {
            _id: 'CS2110', // 🎯 这门课在两个 requirements 中都有
            isScheduled: true,
            semester: 'SP24',
            credit: 4,
            sections: ['001'],
            usedInRequirements: [], // 初始为空
          },
          {
            _id: 'CS3410',
            isScheduled: true,
            semester: 'FA24',
            credit: 4,
            sections: ['001'],
            usedInRequirements: [],
          },
        ],
      };

      // Mock courses
      const mockCourses = [
        {
          _id: 'CS1110',
          catalogNbr: '1110',
          subject: 'CS',
          sbj: 'CS',
          nbr: '1110',
          lvl: 'UG',
          smst: ['FA23', 'FA24', 'SP25'],
          titleLong: 'Intro to Computing',
          courseHasTopic: false,
          isActive: true,
          acadCareer: 'UGRD',
          acadGroup: 'EN',
          unitsMaximum: 4,
          enrollGroups: [
            {
              grpIdentifier: 'CS1110_001',
              grpSmst: ['FA23', 'FA24', 'SP25'],
              locationConflicts: false,
              hasTopic: false,
              topic: '',
            },
          ],
        } as any,
        {
          _id: 'CS2110',
          subject: 'CS',
          titleLong: 'Data Structures',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS2110_001', grpSmst: ['SP24', 'FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
        {
          _id: 'CS3110',
          subject: 'CS',
          titleLong: 'Functional Programming',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS3110_001', grpSmst: ['FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
        {
          _id: 'CS3410',
          subject: 'CS',
          titleLong: 'Computer Architecture',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS3410_001', grpSmst: ['FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
        {
          _id: 'CS4410',
          subject: 'CS',
          titleLong: 'Operating Systems',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS4410_001', grpSmst: ['FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
      ];

      // ========== 2. Mock 数据库调用 ==========
      (ProgramTreeModel.findById as jest.Mock).mockResolvedValue({
        toObject: () => mockProgram,
      });

      (RequirementTreeModel.find as jest.Mock).mockResolvedValue([
        { toObject: () => mockRequirement1 },
        { toObject: () => mockRequirement2 },
      ]);

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      mockGetCoursesByIds.mockImplementation(async (ids: string[]) => {
        return mockCourses.filter(c => ids.includes(c._id));
      });

      // ========== 3. 调用 getProgram ==========
      const result = await getProgram('cs', 'user1', 'FA24');

      // ========== 4. 验证结果 ==========
      expect(result).toBeDefined();
      expect(result.requirementsList).toHaveLength(2);

      // 找到两个 requirements
      const coreReq = result.requirementsList.find(r => r.requirementInfo._id === 'cs1');
      const electivesReq = result.requirementsList.find(r => r.requirementInfo._id === 'cs2');

      expect(coreReq).toBeDefined();
      expect(electivesReq).toBeDefined();

      // ========== 5. 验证 Core Requirement (cs1) ==========
      const coreNode = coreReq!.nodesById['cs1_courses'];
      expect(coreNode.type).toBe('COURSE_SET');
      if (coreNode.type === 'COURSE_SET') {
        // 应该有 2 门课被使用：CS1110 和 CS2110
        expect(coreNode.nodeState.completedUsedOptionIds).toHaveLength(2);
        expect(coreNode.nodeState.completedUsedOptionIds).toContain('CS1110');
        expect(coreNode.nodeState.completedUsedOptionIds).toContain('CS2110');
        
        // CS2110 应该被计数（isCountedHere = true）
        const cs2110Option = coreNode.options.find(o => o.course._id === 'CS2110');
        expect(cs2110Option?.allocation.isCountedHere).toBe(true);
      }

      // ========== 6. 验证 Electives Requirement (cs2) ==========
      const electivesNode = electivesReq!.nodesById['cs2_courses'];
      expect(electivesNode.type).toBe('COURSE_SET');
      if (electivesNode.type === 'COURSE_SET') {
        // 🎯 正确行为：CS2110 不能在 cs2 中使用
        // 因为 cs1 和 cs2 是 conflictsWith（互斥）的
        // CS2110 已经被 cs1 使用，所以 cs2 不能再用
        
        // CS2110 应该在 notUsed 列表中
        expect(electivesNode.nodeState.completedNotUsedOptionIds).toContain('CS2110');
        
        // CS2110 不应该被计数
        const cs2110Option = electivesNode.options.find(o => o.course._id === 'CS2110');
        expect(cs2110Option?.allocation.isCountedHere).toBe(false);
        if (cs2110Option && !cs2110Option.allocation.isCountedHere) {
          expect(cs2110Option.allocation.notCountedReasons).toHaveLength(1);
          expect(cs2110Option.allocation.notCountedReasons[0].reason).toBe('ALREADY_COUNTED_ELSEWHERE');
          expect(cs2110Option.allocation.notCountedReasons[0].requirementId).toBe('cs1');
        }
        
        // CS3410 在 FA24（当前学期），状态是 IN_PROGRESS
        expect(electivesNode.nodeState.inProgressUsedOptionIds).toContain('CS3410');
      }

      // ========== 7. 验证 Summary ==========
      // Core: 2/2 完成 (CS1110 + CS2110)
      expect(coreReq!.summary.completedCount).toBe(2);
      expect(coreReq!.summary.isFulfilled).toBe(true);

      // Electives: 0 completed, 1 in progress
      // ❌ CS2110 不能用（已被 cs1 使用，且互斥）
      // 🔄 CS3410 是 IN_PROGRESS（在当前学期 FA24）
      expect(electivesReq!.summary.completedCount).toBe(0);
      expect(electivesReq!.summary.inProgressCount).toBe(1);
      expect(electivesReq!.summary.isFulfilled).toBe(false);

      // Program: cs2 未完全满足
      expect(result.summary.isFulfilled).toBe(false);
    });

    test('课程在两个 NON-conflictsWith（可共享）的 requirements 中可以都被计数', async () => {
      // ========== 1. 准备测试数据 ==========
      
      const mockProgram: ProgramData = {
        _id: 'cs',
        name: 'Computer Science',
        type: 'major',
        yearDependent: false,
        majorDependent: false,
        collegeDependent: false,
        concentrationDependent: false,
        colleges: [{ collegeId: 'seas', name: 'Engineering' }],
        requirementSets: [
          {
            appliesTo: {},
            requirementIds: ['cs1', 'cs2'],
          },
        ],
      };

      // Requirement 1: Core - 不与 cs2 conflictsWith
      const mockRequirement1: RequirementData = {
        _id: 'cs1',
        uiType: 'GROUP',
        programId: 'cs',
        name: 'Core Requirements',
        description: ['Core courses'],
        conflictsWith: [], // ❌ 不与任何 requirement conflictsWith
        rootNodeId: 'cs1_root',
        nodesData: [
          {
            nodeId: 'cs1_root',
            type: 'GROUP',
            title: 'Core',
            rule: { pick: 1 },
            children: ['cs1_courses'],
          },
          {
            nodeId: 'cs1_courses',
            type: 'COURSE_SET',
            title: 'Core Courses',
            rule: { pick: 2 },
            options: ['CS1110', 'CS2110'],
            courseNotes: [],
          },
        ],
      };

      // Requirement 2: Electives - 不与 cs1 conflictsWith
      const mockRequirement2: RequirementData = {
        _id: 'cs2',
        uiType: 'GROUP',
        programId: 'cs',
        name: 'Electives',
        description: ['Elective courses'],
        conflictsWith: [], // ✅ 不与任何 requirement conflictsWith（可以共享）
        rootNodeId: 'cs2_root',
        nodesData: [
          {
            nodeId: 'cs2_root',
            type: 'GROUP',
            title: 'Electives',
            rule: { pick: 1 },
            children: ['cs2_courses'],
          },
          {
            nodeId: 'cs2_courses',
            type: 'COURSE_SET',
            title: 'Elective Courses',
            rule: { pick: 2 },
            options: ['CS2110', 'CS3410'], // CS2110 也在这里
            courseNotes: [],
          },
        ],
      };

      // User: 只完成了 CS1110 和 CS2110
      const mockUser = {
        _id: 'user1',
        year: '2023',
        college: { collegeId: 'seas', name: 'Engineering' },
        majors: [{ majorId: 'cs', name: 'Computer Science', concentrationNames: [] }],
        minors: [],
        courses: [
          {
            _id: 'CS1110',
            isScheduled: true,
            semester: 'FA23',
            credit: 4,
            sections: ['001'],
            usedInRequirements: [],
          },
          {
            _id: 'CS2110', // 🎯 这门课在两个 requirements 中都有
            isScheduled: true,
            semester: 'SP24',
            credit: 4,
            sections: ['001'],
            usedInRequirements: [],
          },
        ],
      };

      const mockCourses = [
        {
          _id: 'CS1110',
          subject: 'CS',
          titleLong: 'Intro to Computing',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS1110_001', grpSmst: ['FA23', 'FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
        {
          _id: 'CS2110',
          subject: 'CS',
          titleLong: 'Data Structures',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS2110_001', grpSmst: ['SP24', 'FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
        {
          _id: 'CS3410',
          subject: 'CS',
          titleLong: 'Computer Architecture',
          courseHasTopic: false,
          enrollGroups: [{ grpIdentifier: 'CS3410_001', grpSmst: ['FA24', 'SP25'], locationConflicts: false, hasTopic: false, topic: '' }],
        } as any,
      ];

      // Mock 数据库调用
      (ProgramTreeModel.findById as jest.Mock).mockResolvedValue({
        toObject: () => mockProgram,
      });

      (RequirementTreeModel.find as jest.Mock).mockResolvedValue([
        { toObject: () => mockRequirement1 },
        { toObject: () => mockRequirement2 },
      ]);

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      mockGetCoursesByIds.mockImplementation(async (ids: string[]) => {
        return mockCourses.filter(c => ids.includes(c._id));
      });

      // ========== 3. 调用 getProgram ==========
      const result = await getProgram('cs', 'user1', 'FA24');

      // ========== 4. 验证结果 ==========
      const coreReq = result.requirementsList.find(r => r.requirementInfo._id === 'cs1');
      const electivesReq = result.requirementsList.find(r => r.requirementInfo._id === 'cs2');

      // ========== 5. 验证 Core Requirement (cs1) ==========
      const coreNode = coreReq!.nodesById['cs1_courses'];
      if (coreNode.type === 'COURSE_SET') {
        // CS1110 和 CS2110 都在 Core 中被使用
        expect(coreNode.nodeState.completedUsedOptionIds).toHaveLength(2);
        expect(coreNode.nodeState.completedUsedOptionIds).toContain('CS1110');
        expect(coreNode.nodeState.completedUsedOptionIds).toContain('CS2110');
      }

      // ========== 6. 验证 Electives Requirement (cs2) ==========
      const electivesNode = electivesReq!.nodesById['cs2_courses'];
      if (electivesNode.type === 'COURSE_SET') {
        // 🎯 正确行为：CS2110 可以在这里被使用！
        // 因为 cs1 和 cs2 不是 conflictsWith（可以共享课程）
        expect(electivesNode.nodeState.completedUsedOptionIds).toHaveLength(1);
        expect(electivesNode.nodeState.completedUsedOptionIds).toContain('CS2110');
        
        // CS2110 应该被计数
        const cs2110Option = electivesNode.options.find(o => o.course._id === 'CS2110');
        expect(cs2110Option?.allocation.isCountedHere).toBe(true);
      }

      // ========== 7. 验证 Summary ==========
      // Core: 2/2 完成
      expect(coreReq!.summary.completedCount).toBe(2);
      expect(coreReq!.summary.isFulfilled).toBe(true);

      // Electives: 1/2 完成（CS2110 可以共享）
      expect(electivesReq!.summary.completedCount).toBe(1);
      expect(electivesReq!.summary.isFulfilled).toBe(false);

      // Program: 未完全满足（cs2 只有 1/2）
      expect(result.summary.isFulfilled).toBe(false);
    });
  });
});
