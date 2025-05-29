import admin from '../db/firebaseAdmin.js';
import axios from 'axios';

const firestore = admin.firestore();
const rtdb = admin.database();

// Configuration
const CONFIG = {
  clientBatchSize: 5,
  scheduleBatchSize: 20,
  apiTimeout: 5000,
  maxRetries: 3,
  stateVerificationDelay: 2000 // Wait 2s for hardware to respond
};

/**
 * Main scheduler function
 */
export const checkAllClientsSchedules = async () => {
  const executionId = Date.now();
  console.log(`⏰ [${executionId}] Starting global schedule check...`);
  
  try {
    const clientsSnapshot = await firestore.collection('clientInformation').get();
    if (clientsSnapshot.empty) {
      console.log(`ℹ️ [${executionId}] No clients found`);
      return { success: true, totalProcessed: 0 };
    }

    const allClientIds = clientsSnapshot.docs.map(doc => doc.id);
    let totalProcessed = 0;

    // Process clients in parallel batches
    for (let i = 0; i < allClientIds.length; i += CONFIG.clientBatchSize) {
      const batch = allClientIds.slice(i, i + CONFIG.clientBatchSize);
      const results = await Promise.allSettled(
        batch.map(clientId => processClientSchedules(clientId, executionId))
      );
      totalProcessed += results.reduce((sum, r) => sum + (r.value?.processed || 0), 0);
    }

    console.log(`✅ [${executionId}] Processed ${totalProcessed} schedules across ${allClientIds.length} clients`);
    return { success: true, totalClients: allClientIds.length, totalProcessed };

  } catch (error) {
    console.error(`❌ [${executionId}] Global error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Process schedules for a single client
 */
async function processClientSchedules(clientUid, executionId) {
  const now = new Date();
  let processed = 0;

  try {
    const schedules = await firestore.collection(`clientInformation/${clientUid}/schedules`)
      .where('enabled', '==', true)
      .get();

    if (schedules.empty) {
      console.log(`ℹ️ [${executionId}] No schedules for ${clientUid}`);
      return { processed };
    }

    // Process schedules in batches
    const scheduleDocs = schedules.docs;
    for (let i = 0; i < scheduleDocs.length; i += CONFIG.scheduleBatchSize) {
      const batch = scheduleDocs.slice(i, i + CONFIG.scheduleBatchSize);
      processed += (await Promise.allSettled(
        batch.map(doc => executeSchedule(doc, now, executionId, clientUid))
      )).filter(r => r.status === 'fulfilled').length;
    }

    console.log(`✔️ [${executionId}] ${clientUid}: ${processed} schedules executed`);
    return { processed };

  } catch (error) {
    console.error(`⚠️ [${executionId}] Client ${clientUid} failed:`, error.message);
    throw error;
  }
}

/**
 * Core schedule execution with state verification
 */
async function executeSchedule(doc, now, executionId, clientUid) {
  const schedule = doc.data();
  const scheduleId = doc.id;
  const { boardId, applianceName, shouldBeOn } = schedule;

  try {
    // 1. Check schedule activation
    if (!isScheduleActive(schedule, now)) {
      return { skipped: true };
    }

    // 2. Prepare appliance reference
    const appliancePath = `clients/${clientUid}/boards/${boardId.trim()}/appliances/${applianceName.trim()}`;
    const applianceRef = rtdb.ref(appliancePath);

    // 3. Get current state with transaction
    const { status } = (await applianceRef.once('value')).val() || {};
    console.log(`[${executionId}] ${applianceName} current: ${status}, target: ${shouldBeOn}`);

    // 4. Skip if already in target state
    if (status === shouldBeOn) {
      return { skipped: true, reason: 'State already correct' };
    }

    // 5. Set lock and attempt timestamp
    await applianceRef.update({ 
      _lock: executionId,
      _lastAttempt: now.toISOString() 
    });

    // 6. Execute toggle with retries
    for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
      try {
        // 6a. Call toggle API
        await axios.post(
          `${process.env.API_BASE_URL}/api/client/${clientUid}/toggle-appliance`,
          {
            boardId: boardId.trim(),
            applianceName: applianceName.trim(),
            expectedState: shouldBeOn,
            attempt,
            executionId
          },
          { timeout: CONFIG.apiTimeout }
        );

        // 6b. Verify physical state
        const verifiedState = await verifyHardwareState(clientUid, boardId, applianceName);
        console.log(`[${executionId}] Hardware verification: ${verifiedState}`);

        // 6c. Update DB only if verification succeeds
        if (verifiedState === shouldBeOn) {
          await applianceRef.update({ 
            status: verifiedState,
            _lock: null,
            _lastUpdated: new Date().toISOString() 
          });
          console.log(`✅ [${executionId}] ${applianceName} confirmed ${shouldBeOn ? 'ON' : 'OFF'}`);
          return { success: true };
        }

        throw new Error(`State mismatch after toggle (expected ${shouldBeOn}, got ${verifiedState})`);

      } catch (error) {
        if (attempt === CONFIG.maxRetries) {
          await applianceRef.update({ _lock: null });
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

  } catch (error) {
    console.error(`❌ [${executionId}] ${applianceName} failed:`, error.message);
    throw error;
  }
}

/**
 * Hardware state verification (implement according to your IoT setup)
 */
async function verifyHardwareState(clientUid, boardId, applianceName) {
  // Implementation options:
  // 1. Direct device polling (HTTP/MQTT)
  // 2. Webhook callback from device
  // 3. Fallback to optimistic update
  
  // Temporary implementation (replace with actual verification)
  return new Promise(resolve => {
    setTimeout(() => {
      // For testing purposes, assume toggle succeeded
      resolve(true); // Change to false for OFF schedules
    }, CONFIG.stateVerificationDelay);
  });
}

/**
 * Schedule activation check
 */
function isScheduleActive(schedule, now) {
  const currentTime = now.toTimeString().substring(0, 5);
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentDate = now.toISOString().split('T')[0];

  // Time check (inclusive of endTime)
  if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
    return false;
  }

  // Repeat pattern check
  switch (schedule.repeat) {
    case 'daily': return true;
    case 'specific_date': return schedule.date === currentDate;
    case 'custom_days': return schedule.days?.includes(currentDay);
    default: return false;
  }
}
