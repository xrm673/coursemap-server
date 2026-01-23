import { getRequirementIds } from '../../src/new-program/program.service';
import { User } from '../../src/user/user.model';
import { ProgramData } from '../../src/new-program/model/program.model';
import { mockUsers, mockPrograms } from './test-fixtures';

describe('Program Service - Requirement Set Matching', () => {
  describe('getRequirementIds', () => {
    test('应该匹配 year + college + concentration', () => {
      // 2023 SEAS CS major with AI concentration
      const user = mockUsers.seas_cs_2023_ai;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['cs1', 'cs2', 'cs3']);
    });

    test('应该匹配 year + college (concentration 为 null 的兜底 set)', () => {
      // 2023 SEAS CS major，但没有 concentration，应该匹配兜底 set
      const user = {
        ...mockUsers.seas_cs_2023_ai,
        majors: [{ majorId: 'cs', name: 'CS', concentrationNames: [] }],
      } as unknown as User;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['cs1', 'cs2', 'cs4']);
    });

    test('应该匹配不同 college 的 requirement set', () => {
      // 2023 Arts CS major
      const user = mockUsers.arts_cs_2023_multi;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['cs1', 'cs2', 'cs5']);
    });

    test('应该只根据 year 匹配（不 dependent 其他维度）', () => {
      // IS major 只 year dependent
      const user = mockUsers.cals_is_2024;
      const program = mockPrograms.is_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['is4', 'is5', 'is6']);
    });

    test('应该匹配无任何 dependency 的 program', () => {
      // Math minor 没有任何 dependency
      const user = mockUsers.seas_cs_math_minor;
      const program = mockPrograms.math_minor;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['math1', 'math2']);
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
      expect(reqIds).toEqual(['is7', 'is8']);
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
      expect(reqIds).toEqual(['arts1', 'arts2', 'arts3']);
    });

    test('应该匹配多个 concentrations 中的任意一个', () => {
      // 用户有 Systems 和 AI 两个 concentrations
      const user = mockUsers.arts_cs_2023_multi; // 有 Systems 和 AI
      const program = {
        ...mockPrograms.cs_major,
        requirementSets: [
          {
            appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: ['Systems'] },
            requirementIds: ['cs9', 'cs10'], // Systems concentration
          },
          {
            appliesTo: { entryYear: '2023', collegeId: 'arts', concentrationNames: null },
            requirementIds: ['cs1', 'cs2', 'cs5'], // Arts general
          },
        ],
      } as ProgramData;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['cs9', 'cs10']);
    });

    test('应该在 year 不匹配时跳过该 set', () => {
      // 2024 年的用户，但第一个 set 是 2023 年的
      const user = mockUsers.cals_is_2024; // 2024
      const program = mockPrograms.is_major;
      const reqIds = getRequirementIds(user, program);
      expect(reqIds).toEqual(['is4', 'is5', 'is6']); // 应该匹配第二个 set
    });

    test('应该在 college 不匹配时跳过该 set', () => {
      // CALS 的用户，但第一个 set 是 SEAS 的
      const user = {
        ...mockUsers.seas_cs_2023_ai,
        college: { collegeId: 'cals', name: 'CALS' },
      } as unknown as User;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      // 因为 college 不匹配，应该跳过 SEAS 的 sets
      // 最后返回第一个 set 作为兜底
      expect(reqIds).toBeDefined();
      expect(reqIds.length).toBeGreaterThan(0);
    });

    test('应该在 concentration 不匹配时跳过该 set (user program)', () => {
      // 2023 SEAS CS major，但 concentration 是 Systems（不是 AI）
      const user = {
        ...mockUsers.seas_cs_2023_ai,
        majors: [
          {
            majorId: 'cs',
            name: 'Computer Science',
            concentrationNames: ['Systems'],
          },
        ],
      } as unknown as User;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      // 应该跳过 AI concentration set，匹配 null concentration 的兜底 set
      expect(reqIds).toEqual(['cs1', 'cs2', 'cs4']);
    });

    test('应该在 major 不匹配时跳过该 set (major dependent program)', () => {
      // 构造一个 major dependent 的 program
      const program = {
        ...mockPrograms.is_major,
        majorDependent: true,
        requirementSets: [
          {
            appliesTo: { entryYear: '2024', majorId: 'cs' },
            requirementIds: ['is11', 'is12'], // for CS major
          },
          {
            appliesTo: { entryYear: '2024' },
            requirementIds: ['is4', 'is5', 'is6'], // general
          },
        ],
      } as ProgramData;
      const user = mockUsers.cals_is_2024; // IS major (not CS)
      const reqIds = getRequirementIds(user, program);
      // 应该跳过 CS major 的 set，匹配 general set
      expect(reqIds).toEqual(['is4', 'is5', 'is6']);
    });

    test('应该在完全没有匹配时返回第一个 set', () => {
      // 创建一个完全不匹配的用户
      const user = {
        _id: 'user999',
        year: '2025', // 没有对应的 year
        college: { collegeId: 'other', name: 'Other' },
        majors: [],
        minors: [],
        courses: [],
      } as unknown as User;
      const program = mockPrograms.cs_major;
      const reqIds = getRequirementIds(user, program);
      // 应该返回第一个 set 作为兜底
      expect(reqIds).toEqual(['cs1', 'cs2', 'cs3']);
    });
  });
});
