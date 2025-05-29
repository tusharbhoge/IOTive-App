import admin  from '../db/firebaseAdmin.js';
import { validateScheduleData } from '../utils/validators.js';
import { FieldValue } from 'firebase-admin/firestore';


export const getSchedules = async (req, res) => {
    try {
        const { clientUid } = req.params;

        console.log(`🔍 Fetching schedules for client: ${clientUid}`);

        const schedulesRef = admin.firestore()
            .collection("clientInformation")
            .doc(String(clientUid))
            .collection("schedules");

        const snapshot = await schedulesRef.get();

        if (snapshot.empty) {
            console.log("⚠️ No schedules found!");
            return res.status(200).json({ schedules: [] });
        }

        const schedules = snapshot.docs.map(doc => ({
            id: doc.id,  // Changed from scheduleId to id to match frontend
            ...doc.data()
        }));

        console.log(`✅ Retrieved ${schedules.length} schedules`);
        res.status(200).json({ schedules });

    } catch (error) {
        console.error("❌ Error fetching schedules:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching schedules", 
            error: error.message 
        });
    }
};

export const addSchedule = async (req, res) => {
    try {
        const { clientUid } = req.params;
        const scheduleData = req.body;

        console.log(`➕ Adding new schedule for client: ${clientUid}`);
        console.log('Incoming Schedule Data:', scheduleData);

        // 1. Input Validation
        if (!clientUid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client UID is required' 
            });
        }

        const { valid, errors } = validateScheduleData(scheduleData);
        if (!valid) {
            console.log("⚠️ Validation errors:", errors);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors 
            });
        }

        // 2. Get Firestore references
        const db = admin.firestore();
        const clientInfoRef = db.collection('clientInformation').doc(clientUid);
        const clientInfoDoc = await clientInfoRef.get();
        if (!clientInfoDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Client information not found',
            });
        }

        const schedulesCollectionRef = clientInfoRef.collection('schedules');
        
        // 3. Prepare schedule data
        const newSchedule = {
            applianceId: scheduleData.applianceId,
            applianceName: scheduleData.applianceId,
            boardId: scheduleData.boardId,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            repeat: scheduleData.repeat,
            enabled: scheduleData.enabled !== undefined ? scheduleData.enabled : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Add optional fields
        if (scheduleData.days) newSchedule.days = scheduleData.days;
        if (scheduleData.date) newSchedule.date = scheduleData.date;

        console.log('New Schedule Data:', newSchedule);

        // 4. Create document with auto-generated ID
        const docRef = await schedulesCollectionRef.add(newSchedule);
        const createdSchedule = await docRef.get();

        console.log(`✅ Schedule created with ID: ${docRef.id}`);
        return res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            schedule: {
                scheduleId: docRef.id,
                ...createdSchedule.data()
            }
        });

    } catch (error) {
        console.error('❌ Error creating schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create schedule',
            error: error.message
        });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const { clientUid, scheduleId } = req.params;
        const updateData = req.body;

        console.log(`🔄 Updating schedule ${scheduleId} for client: ${clientUid}`);

        // 1. Input Validation
        if (!clientUid || !scheduleId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client UID and Schedule ID are required' 
            });
        }

        const { valid, errors } = validateScheduleData(updateData, true);
        if (!valid) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors 
            });
        }

        // 2. Get Firestore reference
        const scheduleRef = admin.firestore()
            .collection("clientInformation")
            .doc(clientUid)
            .collection("schedules")
            .doc(scheduleId);

        // 3. Check if document exists
        const doc = await scheduleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ 
                success: false,
                message: 'Schedule not found' 
            });
        }

        // 4. Prepare update data
        const updatePayload = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // 5. Update document
        await scheduleRef.update(updatePayload);
        const updatedSchedule = await scheduleRef.get();

        console.log(`✅ Schedule ${scheduleId} updated successfully`);
        return res.status(200).json({
            success: true,
            message: 'Schedule updated successfully',
            schedule: {
                scheduleId,
                ...updatedSchedule.data()
            }
        });

    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update schedule',
            error: error.message
        });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        const { clientUid, scheduleId } = req.params;

        console.log(`🗑️ Deleting schedule ${scheduleId} for client: ${clientUid}`);

        // 1. Input Validation
        if (!clientUid || !scheduleId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client UID and Schedule ID are required' 
            });
        }

        // 2. Get Firestore reference
        const scheduleRef = admin.firestore()
            .collection("clientInformation")
            .doc(clientUid)
            .collection("schedules")
            .doc(scheduleId);

        // 3. Check if document exists
        const doc = await scheduleRef.get();
        if (!doc.exists) {
            return res.status(404).json({ 
                success: false,
                message: 'Schedule not found' 
            });
        }

        // 4. Delete document
        await scheduleRef.delete();

        console.log(`✅ Schedule ${scheduleId} deleted successfully`);
        return res.status(200).json({
            success: true,
            message: 'Schedule deleted successfully',
            scheduleId
        });

    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete schedule',
            error: error.message
        });
    }
};


export const toggleScheduleStatus = async (req, res) => {
    try {
        const { clientUid, scheduleId } = req.params;
        const { enabled } = req.body;

        // Validate input
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value - must be boolean',
                received: typeof enabled
            });
        }

        // Get document reference
        const scheduleRef = admin.firestore()
            .collection("clientInformation")
            .doc(String(clientUid))
            .collection("schedules")
            .doc(scheduleId);

        // Check if document exists
        const doc = await scheduleRef.get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
                scheduleId
            });
        }

        // Verify we're actually changing the status
        const currentStatus = doc.data().enabled;
        if (currentStatus === enabled) {
            return res.status(200).json({
                success: true,
                message: 'Status unchanged',
                scheduleId,
                enabled
            });
        }

        // Update document
        await scheduleRef.update({
            enabled,
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: 'Schedule status updated',
            scheduleId,
            enabled,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error toggling schedule status:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle schedule status',
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message
            })
        });
    }
};