// src/user/user.schema.ts
// MongoDB schema for User model

import { ObjectId } from 'mongodb';

export const userSchema = {
  name: 'users',
  fields: {
    _id: { type: 'objectId' },
    email: { type: 'string' },
    netid: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    year: { type: 'string' },
    college: { 
      type: 'object',
      fields: {
        collegeId: { type: 'string' },
        name: { type: 'string' }
      }
    },
    majors: {
      type: 'array',
      items: {
        type: 'object',
        fields: {
          majorId: { type: 'string' },
          name: { type: 'string' },
          concentrationNames: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    scheduleData: {
      type: 'array',
      items: {
        type: 'object',
        fields: {
          _id: { type: 'string' },
          semester: { type: 'string' },
          credit: { type: 'number' },
          grpIdentifier: { type: 'string' },
          sections: { 
            type: 'array',
            items: { type: 'string' }
          },
          usedInRequirements: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    favoredCourses: {
      type: 'array',
      items: {
        type: 'object',
        fields: {
          _id: { type: 'string' },
          grpIdentifier: { type: 'string' }
        }
      }
    },
    passwordHash: { type: 'string' },
    role: { type: 'string' },
    lastLogin: { type: 'date' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' }
  }
}; 