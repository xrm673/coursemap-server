// server/db/firebase-admin.ts
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Get the path to the service account key
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'firebase', 'service-account.json');

// Check if the service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Firebase service account key not found at ${serviceAccountPath}. 
    Please set the FIREBASE_SERVICE_ACCOUNT_PATH environment variable or place the key file at ~/.config/firebase/service-account.json`);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };