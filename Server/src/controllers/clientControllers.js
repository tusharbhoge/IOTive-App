import { db } from "../db/index.js";
import admin from "firebase-admin";
import setCustomClaims from "../utils/setCustomClaims.js";


// ✅ User Login Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ✅ Firebase Authentication: Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    if (!userRecord) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Generate custom token for authentication
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // ✅ Get user's custom claims (e.g., role)
    const userClaims = await admin.auth().getUser(userRecord.uid);
    const role = userClaims.customClaims?.role || "user"; // Default role is "user"

    // ✅ Prepare response data
    const responseData = {
      message: "Login successful",
      token: customToken,
      user: {
        id: userRecord.uid, // Use Firebase UID as the ID
        name: userRecord.displayName || "Guest", // Use displayName or default to "Guest"
        role: role, // Use custom claims or default role
      },
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



