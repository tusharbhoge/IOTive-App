import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

const initializeFirebase = async () => {
  try {
    // Ensure FIREBASE_SERVICE_ACCOUNT_PATH is set in .env
    const serviceAccountPath = "../../firestoreinfo/path-to-your-service-account.json";

    if (!serviceAccountPath) {
      throw new Error("❌ FIREBASE_SERVICE_ACCOUNT_PATH not found in .env file");
    }

    // Construct the absolute path for the service account JSON file
    const serviceAccountFilePath = `${__dirname}/${serviceAccountPath}`;

    // Reading the service account JSON file
    const serviceAccount = JSON.parse(await readFile(serviceAccountFilePath, "utf8"));

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    console.log("🔥 Firebase Admin Initialized");
  } catch (error) {
    console.error("🏠 Firebase Initialization Error:", error.message || error);
  }
};

// Call the initialization function
await initializeFirebase();

// Export Firebase authentication and Firestore services
export const auth = admin.auth();
export const db = admin.firestore();
