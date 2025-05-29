import { db } from "../db/index.js";
import admin from "../db/firebaseAdmin.js";


export const getAppliances = async (req, res) => {
    try {
        const { clientUid } = req.params;
        
        // Reference to Realtime Database path
        const rtdbRef = admin.database().ref(`clients/${clientUid}/boards`);
        
        const snapshot = await rtdbRef.once("value");

        if (!snapshot.exists()) {
            console.warn(`⚠️ No boards found for clientUid: ${clientUid}`);
            return res.status(404).json({ message: "No boards found for this client" });
        }

        const boardsData = snapshot.val();
        let appliancesList = [];

        // Extract appliances from all boards
        for (const boardId in boardsData) {
            const board = boardsData[boardId];
            const roomName = board.room || "Unknown"; // Extract room name
            const appliances = board.appliances || {};

            for (const applianceId in appliances) {
                appliancesList.push({
                    boardId: boardId,
                    room: roomName,
                    applianceId: applianceId,
                    ...appliances[applianceId], // Appliance data: lastUpdated, powerUsage, status
                    path: `clients/${clientUid}/boards/${boardId}/appliances/${applianceId}` // Full database path
                });
            }
        }

        res.status(200).json({
            appliances: appliancesList
        });

    } catch (error) {
        console.error("❌ Error fetching appliances:", error);
        res.status(500).json({ message: "Error fetching appliances", error: error.message });
    }
};

export const toggleAppliance = async (req, res) => {
    console.log("🔵 toggleAppliance API hit!"); // Add this to check if it's working

    try {
        const clientUid = req.params.clientUid;
        const {  boardId, applianceName } = req.body;
        console.log(`📡 Received data: clientUid=${clientUid}, boardId=${boardId}, applianceName=${applianceName}`);

        // Reference to RTDB
        const rtdbRef = admin.database().ref(`clients/${clientUid}/boards/${boardId}/appliances/${applianceName}`);

        // Get current status
        const snapshot = await rtdbRef.once("value");
        const applianceData = snapshot.val();

        if (!applianceData) {
            console.error("❌ Appliance not found!");
            return res.status(404).json({ message: "Appliance not found!" });
        }

        // Toggle status
        const newStatus = !applianceData.status;
        console.log(`🔄 Toggling status from ${applianceData.status} to ${newStatus}`);

        // Update RTDB with new status
        await rtdbRef.update({ status: newStatus });

        console.log(`✅ Appliance "${applianceName}" status updated to: ${newStatus}`);
        res.status(200).json({ message: "Appliance status updated successfully!", newStatus });

    } catch (error) {
        console.error("❌ Error toggling appliance:", error);
        res.status(500).json({ message: "Error toggling appliance", error: error.message });
    }
};



export const batchToggleAppliances = async (req, res) => {
    try {
        const { clientUid } = req.params;
        const { appliances } = req.body;
    
        if (!Array.isArray(appliances)) {
          return res.status(400).json({ success: false, message: 'Invalid appliances array' });
        }
    
        // Process each toggle request
        const results = await Promise.all(
          appliances.map(async ({ boardId, applianceId, desiredStatus }) => {
            // Your logic to toggle each appliance
            // Return success/failure for each
            return { boardId, applianceId, success: true };
          })
        );
    
        res.json({ 
          success: true,
          results
        });
    
      } catch (error) {
        console.error('Batch toggle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};




