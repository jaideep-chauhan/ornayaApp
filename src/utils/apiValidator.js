// src/utils/apiValidator.js - Validates API responses and provides guidance on handling

/**
 * Extracts the actual data array from an API response with various possible structures
 * @param {Object} response - The API response object to parse
 * @param {string} key - Optional key name to look for specific data
 * @returns {Array|null} The extracted data array or null if not found
 */
export const extractDataArray = (response, key = null) => {
    if (!response) {
        return [];
    }

    // Case 1: Response has data property that is an array
    if (response.data && Array.isArray(response.data)) {
        return response.data;
    }

    // Case 2: Response has nested data.data array (common pattern)
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
    }

    // Case 3: Looking for a specific key in the response
    if (key && response[key] && Array.isArray(response[key])) {
        return response[key];
    }

    // Case 4: Looking for a specific key in response.data
    if (key && response.data && response.data[key] && Array.isArray(response.data[key])) {
        return response.data[key];
    }

    // Case 5: Search for any array in response.data
    if (response.data && typeof response.data === 'object') {
        for (const dataKey in response.data) {
            if (Array.isArray(response.data[dataKey])) {
                return response.data[dataKey];
            }
        }
    }

    // Case 6: Try to find any array in the response
    if (typeof response === 'object') {
        for (const responseKey in response) {
            if (Array.isArray(response[responseKey])) {
                return response[responseKey];
            }
        }
    }

    return [];
};

/**
 * Validates a Redux data structure
 * @param {Object} state - Redux state to analyze
 * @returns {Object} Validation results
 */
export const validateReduxState = (state) => {
    const result = {
        isValid: true,
        issues: []
    };

    // Check if repairs array exists
    if (!state.repairs) {
        result.isValid = false;
        result.issues.push('Missing repairs array');
    } else if (!Array.isArray(state.repairs)) {
        result.isValid = false;
        result.issues.push('repairs is not an array');
    }

    // Check filtered repairs
    if (!state.filteredRepairs) {
        result.isValid = false;
        result.issues.push('Missing filteredRepairs array');
    } else if (!Array.isArray(state.filteredRepairs)) {
        result.isValid = false;
        result.issues.push('filteredRepairs is not an array');
    }

    return result;
};
