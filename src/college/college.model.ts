import { Document } from 'mongoose';
import { CollegeModel } from './college.schema';

export interface MajorInCollege {
    majorId: string;
    name: string;
}

export interface College extends Document {
    name: string;
    majors: MajorInCollege[];
}

/*
 * Find all colleges
 */
export const find = async (): Promise<College[]> => {
    return CollegeModel.find().lean();
};

/*
 * Find a college by its id
 */
export const findById = async (id: string): Promise<College | null> => {
    return CollegeModel.findById(id).lean();
};

/*
 * Search colleges by major name
 */
export const searchByMajor = async (query: string): Promise<College[]> => {
    // Using MongoDB's $regex for case-insensitive search
    return CollegeModel.find({
        'majors.name': { 
            $regex: query, 
            $options: 'i' // case-insensitive
        }
    }).lean();
};