import express from "express";
import {  loginUser } from "../controllers/clientControllers.js"; // ✅ Import loginUser function
import { getAppliances, toggleAppliance , batchToggleAppliances} from "../controllers/applianceController.js";
import { getFilters, addFilter} from "../controllers/filterController.js";
import {
    addSchedule,
    getSchedules,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus
} from '../controllers/scheduleController.js';


const router = express.Router();

// ✅ Route for adding a filter
router.post("/client/:clientUid/add-filter", addFilter);
router.get("/client/:clientUid/get-appliances", getAppliances);
router.post("/client/:clientUid/toggle-appliance", toggleAppliance);
router.get("/client/:clientUid/get-filters", getFilters);


// ✅ Route for adding a schedule
router.post('/client/:clientUid/schedules', addSchedule);
router.get('/client/:clientUid/schedules', getSchedules);
router.put('/client/:clientUid/schedules/:scheduleId', updateSchedule);
router.delete('/client/:clientUid/schedules/:scheduleId',  deleteSchedule);
router.patch('/client/:clientUid/schedules/:scheduleId/status',  toggleScheduleStatus);


// ✅ Route for user login
router.post("/login", loginUser);

export default router;




