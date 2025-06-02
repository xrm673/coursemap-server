import { Schema, model } from 'mongoose';
import { User, UserCollege, UserMajor } from './user.model';
import { CourseFavored, CourseInSchedule } from '../course/course.model';

const UserCollegeSchema = new Schema<UserCollege>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const UserMajorSchema = new Schema<UserMajor>({
  majorId: { type: String, required: true },
  name: { type: String, required: true },
  concentrationNames: [{ type: String }]
}, { _id: false });

const CourseInScheduleSchema = new Schema<CourseInSchedule>({
  _id: { type: String, required: true },
  grpIdentifier: String,
  usedInRequirements: { type: [String], required: true },
  credit: { type: Number, required: true },
  semester: { type: String, required: true },
  sections: [String]
});

const CourseFavoredSchema = new Schema<CourseFavored>({
  _id: { type: String, required: true },
  grpIdentifier: String
});

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  netid: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  year: { type: String, required: true },
  college: UserCollegeSchema,
  majors: [UserMajorSchema],
  scheduleData: [CourseInScheduleSchema],
  favoredCourses: [CourseFavoredSchema],
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], required: true },
  lastLogin: { type: Date }
}, { 
  timestamps: true // This automatically handles createdAt and updatedAt
});

// Create indexes for common queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ netid: 1 }, { unique: true });

export const UserModel = model<User>('User', UserSchema);