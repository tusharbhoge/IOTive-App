import admin from '../db/firebaseAdmin.js';

// Function to set custom claims (roles) for a user
const setCustomClaims = async (uid, role) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`✅ Custom claim '${role}' set for user: ${uid}`);
  } catch (error) {
    console.error('❌ Error setting custom claim:', error);
  }
};

export default setCustomClaims;
