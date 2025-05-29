import { DAYS_OF_WEEK } from '../constant.js';

/**
 * Validates schedule data
 * @param {Object} data 
 * @param {boolean} [isUpdate] 
 * @returns {{valid: boolean, errors: Object}}
 */
export const validateScheduleData = (data, isUpdate = false) => {
    const errors = {};

    if (!data?.applianceId?.trim()) {
        errors.applianceId = 'Appliance ID is required';
    }
    if (!data?.applianceName?.trim()) {
        errors.applianceName = 'Appliance name is required';
    }

    if (!data.startTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.startTime)) {
        errors.startTime = 'Start time is required and must be in HH:MM format';
    }
    
    if (!data.endTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.endTime)) {
        errors.endTime = 'End time is required and must be in HH:MM format';
    }

    if (!data.repeat || !['specific_date', 'daily', 'custom_days'].includes(data.repeat)) {
        errors.repeat = 'Repeat is required and must be one of "specific_date", "daily", or "custom_days"';
    }

    if (data.repeat === 'specific_date' && (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date))) {
        errors.date = 'Date is required for specific_date and must be in YYYY-MM-DD format';
    }

    if (data.repeat === 'custom_days') {
        if (!Array.isArray(data.days) || data.days.length === 0) {
            errors.days = 'Days must be an array with at least one valid day';
        } else {
            const invalidDays = data.days.filter(day => !DAYS_OF_WEEK.includes(day));
            if (invalidDays.length > 0) {
                errors.days = `Invalid days: ${invalidDays.join(', ')}`;
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

