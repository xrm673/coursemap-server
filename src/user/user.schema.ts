import { Schema, model } from 'mongoose';
import { RawCourseInSchedule, RawCourseFavored, User, UserCollege, UserMajor, UserMinor } from './user.model';

const UserCollegeSchema = new Schema<UserCollege>({
  collegeId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const UserMajorSchema = new Schema<UserMajor>({
  majorId: { type: String, required: true },
  name: { type: String, required: true },
  concentrationNames: [{ type: String }],
  trackName: { type: String }
}, { _id: false });

const UserMinorSchema = new Schema<UserMinor>({
  minorId: { type: String, required: true },
  name: { type: String, required: true },
  concentrationNames: [{ type: String }],
  trackName: { type: String }
}, { _id: false });

const RawCourseInScheduleSchema = new Schema<RawCourseInSchedule>({
  _id: { type: String, required: true },
  grpIdentifier: String,
  usedInRequirements: { type: [String], required: true },
  credit: { type: Number, required: true },
  semester: { type: String, required: true },
});

const CourseFavoredSchema = new Schema<RawCourseFavored>({
  _id: { type: String, required: true },
  grpIdentifier: String
});

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  netid: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  year: { type: String, required: true },
  semesters: { type: [String], required: true },
  college: UserCollegeSchema,
  majors: [UserMajorSchema],
  minors: [UserMinorSchema],
  scheduleData: [RawCourseInScheduleSchema],
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