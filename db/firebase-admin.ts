// server/db/firebase-admin.ts
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let serviceAccount;

// Check if Firebase credentials are provided as environment variables
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable. Make sure it contains valid JSON.');
  }
} else {
  // Fall back to file-based configuration for local development
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'firebase', 'service-account.json');

  // Check if the service account file exists
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account key not found at ${serviceAccountPath}. 
      Please set the FIREBASE_SERVICE_ACCOUNT environment variable with the service account JSON 
      or set FIREBASE_SERVICE_ACCOUNT_PATH environment variable with the path to the key file.`);
  }

  // Initialize Firebase Admin from file
  serviceAccount = require(serviceAccountPath);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };