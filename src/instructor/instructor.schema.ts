import { Schema, model } from 'mongoose';
import { Instructor } from './instructor.model';

const InstructorSchema = new Schema<Instructor>({
    _id: { type: String, required: true, unique: true },
    netid: { type: String, required: true },
    lNm: { type: String, required: true },
    fNm: { type: String, required: true },
    mNm: { type: String, required: true },
    rmpId: { type: String, required: false },
    rmpScore: { type: Number, required: false },
});

export const InstructorModel = model<Instructor>('Instructor', InstructorSchema);