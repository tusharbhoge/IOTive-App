import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

// Build the absolute path for the JSON file
const serviceAccountPath = resolve(__dirname, '../../firestoreinfo/path-to-your-service-account.json');

// Read the JSON file manually
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ioitive-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

// Export both admin and the Realtime Database reference
const rtdb = admin.database();
export { admin, rtdb };