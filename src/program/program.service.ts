// src/major/major.service.ts
// Business logic for majors

import * as ProgramModel from './program.model';
import { Program } from './program.model';

/*
    Get all majors, optionally filtered by collegeId
*/
export const getPrograms = async (collegeId?: string): Promise<Program[]> => {
    return await ProgramModel.find(collegeId);
};

/*
    Get a major by its id
*/
export const getProgramById = async (programId: string): Promise<Program> => {
    const program = await ProgramModel.findById(programId);
    if (!program) {
        throw new Error('Program not found');
    }
    return program;
};

