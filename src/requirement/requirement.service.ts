// src/requirement/requirement.service.ts
// Business logic for requirements

import * as RequirementModel from './requirement.model';
import { Requirement } from './requirement.model';
import { RequirementModel as RequirementMongoModel } from './requirement.schema';

export const getRequirements = async (
    programId?: string
): Promise<Requirement[]> => {
    const query = programId ? { programId } : {};
    return await RequirementMongoModel.find(query).lean();
};

export const getRequirementById = async (
    id: string
): Promise<Requirement> => {
    const requirement = await RequirementModel.findById(id);
    if (!requirement) {
        throw new Error('Requirement not found');
    }
    return requirement;
};

export const getRequirementsByIds = async (
    requirementIds: string[]
): Promise<Requirement[]> => {
    return await RequirementMongoModel.find({ _id: { $in: requirementIds } }).lean();
};