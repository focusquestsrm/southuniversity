/**
 * Logger Module
 * Handles application logging without exposing PII or credentials
 */

window.logger = (() => {
    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

    /**
     * Format log message
     */
    function formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level);
        
        let logMessage = `[${timestamp}] [${levelName}] ${message}`;
        
        if (data) {
            // Remove PII before logging
            const sanitizedData = sanitizeData(data);
            logMessage += ` ${JSON.stringify(sanitizedData)}`;
        }
        
        return logMessage;
    }

    /**
     * Sanitize sensitive data
     */
    function sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;

        const sanitized = { ...data };
        const sensitiveFields = [
            'email', 'phone', 'address', 'city', 'zip',
            'firstName', 'lastName', 'name',
            'apiKey', 'secret', 'token', 'credential',
            'credit_card', 'ssn', 'driver_license',
            'password', 'passwordHash'
        ];

        sensitiveFields.forEach(field => {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
            // Also check nested objects
            Object.keys(sanitized).forEach(key => {
                if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                    if (field in sanitized[key]) {
                        sanitized[key] = { ...sanitized[key], [field]: '[REDACTED]' };
                    }
                }
            });
        });

        return sanitized;
    }

    /**
     * Send log to server (if endpoint configured)
     */
    function sendToServer(level, message, data) {
        if (process.env.NODE_ENV === 'production' && level >= LOG_LEVELS.WARN) {
            // In production, optionally send warnings and errors to server
            // This would require a server-side logging endpoint
            // For now, we only log to console
        }
    }

    return {
        debug(message, data) {
            if (LOG_LEVELS.DEBUG >= currentLevel) {
                console.log(formatMessage(LOG_LEVELS.DEBUG, message, data));
            }
        },

        info(message, data) {
            if (LOG_LEVELS.INFO >= currentLevel) {
                console.log(formatMessage(LOG_LEVELS.INFO, message, data));
            }
        },

        warn(message, data) {
            if (LOG_LEVELS.WARN >= currentLevel) {
                console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
                sendToServer(LOG_LEVELS.WARN, message, data);
            }
        },

        error(message, data) {
            if (LOG_LEVELS.ERROR >= currentLevel) {
                console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
                sendToServer(LOG_LEVELS.ERROR, message, data);
            }
        },

        /**
         * Log form submission attempt
         */
        logFormSubmission(data) {
            this.info('Form submission attempt', {
                step: data.step,
                fieldsAttempted: Object.keys(data).length
            });
        },

        /**
         * Log form validation error
         */
        logValidationError(field, errorMessage) {
            this.info('Validation error', {
                field: field,
                error: errorMessage
            });
        },

        /**
         * Log geographic restriction
         */
        logGeographicRestriction(state, reason) {
            this.info('Geographic restriction triggered', {
                state: state,
                reason: reason
            });
        },

        /**
         * Log API call (without credentials)
         */
        logApiCall(endpoint, method, status, duration) {
            this.info('API call', {
                endpoint: endpoint,
                method: method,
                status: status,
                durationMs: duration
            });
        },

        /**
         * Log test mode status
         */
        logTestMode(isTestMode) {
            this.warn(`RUNNING IN TEST MODE - NO LEADS WILL BE SUBMITTED`, {
                testMode: isTestMode
            });
        }
    };
})();

// Log test mode on initialization
if (window.config && window.config.features.testMode) {
    logger.logTestMode(true);
}
