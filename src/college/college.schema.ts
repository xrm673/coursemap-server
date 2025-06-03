import { Schema, model } from 'mongoose';
import { College, MajorInCollege } from './college.model';

const MajorInCollegeSchema = new Schema<MajorInCollege>({
    majorId: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

const CollegeSchema = new Schema<College>({
    _id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    majors: { type: [MajorInCollegeSchema], required: true }
});

export const CollegeModel = model<College>('College', CollegeSchema);