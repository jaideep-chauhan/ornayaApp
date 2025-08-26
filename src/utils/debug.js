// src/utils/debug.js
import { DEBUG_MODE } from './constants';

/**
 * Simple utility to process an API response
 */
export const analyzeApiResponse = (response) => {
    // In production mode, just return the response without processing
    if (!DEBUG_MODE) return response;

    // In debug mode, this would contain detailed logging
    return response;
};

/**
 * Show a toast message with API response info
 */
export const showDebugToast = (data, title = 'Info') => {
    // Do nothing in production mode
    if (!DEBUG_MODE) return;

    // In debug mode, this would show toast messages
};

export default {
    analyzeApiResponse,
    showDebugToast,
};
