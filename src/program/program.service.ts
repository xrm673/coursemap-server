// src/program/program.service.ts
// Business logic for programs

import { Program } from './program.model';
import { ProgramModel as ProgramMongoModel } from './program.schema';

/*
    Get all programs with optional filters
*/
export const getPrograms = async (params?: { type?: string; collegeId?: string; [key: string]: any }): Promise<Program[]> => {
    const query: any = {};
    
    // Add type filter if provided
    if (params?.type) {
        query.type = params.type;
    }
    
    // Add college filter if provided
    if (params?.collegeId) {
        query['colleges.collegeId'] = params.collegeId;
    }

    return await ProgramMongoModel.find(query).lean();
};

/*
    Get a program by its id
*/
export const getProgramById = async (programId: string): Promise<Program> => {
    const program = await ProgramMongoModel.findById(programId);
    if (!program) {
        throw new Error('Program not found');
    }
    return program;
};

