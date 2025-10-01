/**
 * Date formatting utility for consistent date display across the app
 */

/**
 * Format a date value to a readable string
 * @param {string|number|Date} dateValue - The date value to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Whether to include time in the output
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export const formatDate = (dateValue, options = {}) => {
    const { includeTime = false } = options;
    
    if (!dateValue) return 'N/A';
    
    try {
        let date;
        
        // Handle Date object
        if (dateValue instanceof Date) {
            date = dateValue;
        }
        // Handle timestamp (number)
        else if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        }
        // Handle string dates
        else if (typeof dateValue === 'string') {
            // Remove timezone if present (for API dates like "2024-01-01T12:00:00.000Z")
            const cleanedDate = dateValue.replace(/[TZ]/g, ' ').trim();
            
            // Try standard parsing first
            date = new Date(dateValue);
            
            // If invalid, try alternative parsing
            if (isNaN(date.getTime())) {
                // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS)
                const parts = cleanedDate.split(/[- :]/);
                if (parts.length >= 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
                    const day = parseInt(parts[2], 10);
                    const hour = parseInt(parts[3] || 0, 10);
                    const minute = parseInt(parts[4] || 0, 10);
                    const second = parseInt(parts[5] || 0, 10);
                    
                    date = new Date(year, month, day, hour, minute, second);
                }
            }
        }
        
        // Final validation
        if (!date || isNaN(date.getTime())) {
            return 'N/A';
        }
        
        // Format options
        const formatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };
        
        if (includeTime) {
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
        }
        
        return date.toLocaleDateString('en-US', formatOptions);
    } catch (error) {
        console.error('Date formatting error:', error, 'for value:', dateValue);
        return 'N/A';
    }
};

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param {string|number|Date} dateValue - The date value to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return formatDate(dateValue);
    } catch (error) {
        return formatDate(dateValue);
    }
};

/**
 * Check if a date is valid
 * @param {any} dateValue - The value to check
 * @returns {boolean} Whether the date is valid
 */
export const isValidDate = (dateValue) => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
};