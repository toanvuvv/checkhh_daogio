/**
 * Error Handling System for Electron License App
 * Centralized error handling and logging
 */
class ErrorHandler {
    constructor() {
        this.errorTypes = {
            VALIDATION_ERROR: 'VALIDATION_ERROR',
            NETWORK_ERROR: 'NETWORK_ERROR',
            API_ERROR: 'API_ERROR',
            PERMISSION_ERROR: 'PERMISSION_ERROR',
            SYSTEM_ERROR: 'SYSTEM_ERROR',
            USER_ERROR: 'USER_ERROR'
        };
        
        this.errorLog = [];
        this.maxLogSize = 100;
        
        this.setupGlobalErrorHandling();
    }
    
    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event);
            
            this.handleError({
                type: this.errorTypes.SYSTEM_ERROR,
                message: event.message || 'Unknown error',
                filename: event.filename || 'Unknown file',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                error: event.error
            });
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            this.handleError({
                type: this.errorTypes.SYSTEM_ERROR,
                message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason),
                error: event.reason
            });
        });
    }
    
    /**
     * Handle error
     */
    handleError(error, context = {}) {
        try {
            const errorInfo = {
                id: this.generateErrorId(),
                timestamp: new Date().toISOString(),
                type: error.type || this.errorTypes.SYSTEM_ERROR,
                message: error.message || 'Unknown error',
                stack: error.stack || '',
                context: context,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Add to error log
            this.addToLog(errorInfo);
            
            // Log to console
            console.error('Error handled:', errorInfo);
            
            // Show user notification
            this.showUserNotification(errorInfo);
            
            // Report to analytics (if available)
            this.reportError(errorInfo);
            
            return errorInfo;
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            return null;
        }
    }
    
    /**
     * Create validation error
     */
    createValidationError(field, message) {
        return this.handleError({
            type: this.errorTypes.VALIDATION_ERROR,
            message: `Validation error in ${field}: ${message}`,
            field: field
        });
    }
    
    /**
     * Create network error
     */
    createNetworkError(url, status, message) {
        return this.handleError({
            type: this.errorTypes.NETWORK_ERROR,
            message: `Network error: ${message}`,
            url: url,
            status: status
        });
    }
    
    /**
     * Create API error
     */
    createAPIError(endpoint, response, message) {
        return this.handleError({
            type: this.errorTypes.API_ERROR,
            message: `API error: ${message}`,
            endpoint: endpoint,
            response: response
        });
    }
    
    /**
     * Create permission error
     */
    createPermissionError(action, message) {
        return this.handleError({
            type: this.errorTypes.PERMISSION_ERROR,
            message: `Permission error: ${message}`,
            action: action
        });
    }
    
    /**
     * Create user error
     */
    createUserError(message, userAction) {
        return this.handleError({
            type: this.errorTypes.USER_ERROR,
            message: `User error: ${message}`,
            userAction: userAction
        });
    }
    
    /**
     * Add error to log
     */
    addToLog(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }
    
    /**
     * Get error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
    
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Show user notification
     */
    showUserNotification(errorInfo) {
        try {
            const notification = document.createElement('div');
            notification.className = `error-notification error-${errorInfo.type.toLowerCase()}`;
            notification.innerHTML = `
                <div class="error-content">
                    <h4>Lỗi ${this.getErrorTypeName(errorInfo.type)}</h4>
                    <p>${errorInfo.message}</p>
                    <button class="btn btn-small" onclick="this.parentElement.parentElement.remove()">Đóng</button>
                </div>
            `;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
        } catch (notificationError) {
            console.error('Error showing notification:', notificationError);
        }
    }
    
    /**
     * Get error type name
     */
    getErrorTypeName(type) {
        const typeNames = {
            [this.errorTypes.VALIDATION_ERROR]: 'Xác thực',
            [this.errorTypes.NETWORK_ERROR]: 'Mạng',
            [this.errorTypes.API_ERROR]: 'API',
            [this.errorTypes.PERMISSION_ERROR]: 'Quyền truy cập',
            [this.errorTypes.SYSTEM_ERROR]: 'Hệ thống',
            [this.errorTypes.USER_ERROR]: 'Người dùng'
        };
        
        return typeNames[type] || 'Không xác định';
    }
    
    /**
     * Report error to analytics
     */
    reportError(errorInfo) {
        try {
            // This would integrate with your analytics service
            // For now, just log to console
            console.log('Error reported to analytics:', errorInfo);
        } catch (reportError) {
            console.error('Error reporting to analytics:', reportError);
        }
    }
    
    /**
     * Retry operation with exponential backoff
     */
    async retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await this.delay(delay);
            }
        }
        
        throw lastError;
    }
    
    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Wrap async function with error handling
     */
    wrapAsync(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error);
                throw error;
            }
        };
    }
    
    /**
     * Wrap sync function with error handling
     */
    wrapSync(fn) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error);
                throw error;
            }
        };
    }
    
    /**
     * Create error boundary for components
     */
    createErrorBoundary(component, fallbackComponent) {
        return class ErrorBoundary extends component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }
            
            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }
            
            componentDidCatch(error, errorInfo) {
                this.handleError({
                    type: this.errorTypes.SYSTEM_ERROR,
                    message: error.message,
                    stack: error.stack,
                    component: component.name,
                    errorInfo: errorInfo
                });
            }
            
            render() {
                if (this.state.hasError) {
                    return fallbackComponent || document.createElement('div');
                }
                
                return super.render();
            }
        };
    }
    
    /**
     * Validate input with error handling
     */
    validateInput(value, rules) {
        try {
            for (const rule of rules) {
                const result = rule(value);
                if (result !== true) {
                    throw new Error(result);
                }
            }
            return true;
        } catch (error) {
            this.handleError({
                type: this.errorTypes.VALIDATION_ERROR,
                message: error.message
            });
            return false;
        }
    }
    
    /**
     * Safe JSON parse
     */
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            this.handleError({
                type: this.errorTypes.VALIDATION_ERROR,
                message: 'Invalid JSON format',
                error: error
            });
            return defaultValue;
        }
    }
    
    /**
     * Safe JSON stringify
     */
    safeJsonStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            this.handleError({
                type: this.errorTypes.SYSTEM_ERROR,
                message: 'Failed to stringify object',
                error: error
            });
            return defaultValue;
        }
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        try {
            const stats = {
                total: this.errorLog.length,
                byType: {},
                recent: this.errorLog.slice(-10)
            };
            
            this.errorLog.forEach(error => {
                stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting stats:', error);
            return { total: 0, byType: {}, recent: [] };
        }
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        try {
            this.errorLog = [];
            console.log('Error log cleared');
        } catch (error) {
            console.error('Error clearing log:', error);
        }
    }
    
    /**
     * Export error log
     */
    exportErrorLog() {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                errors: this.errorLog,
                stats: this.getErrorStats()
            };
            
            const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Error log exported');
        } catch (error) {
            console.error('Error exporting log:', error);
        }
    }
    
    /**
     * Test error handling
     */
    testErrorHandling() {
        try {
            console.log('Testing error handling...');
            
            // Test validation error
            this.handleError({
                type: this.errorTypes.VALIDATION_ERROR,
                message: 'Test validation error'
            });
            
            // Test network error
            this.handleError({
                type: this.errorTypes.NETWORK_ERROR,
                message: 'Test network error'
            });
            
            // Test system error
            this.handleError({
                type: this.errorTypes.SYSTEM_ERROR,
                message: 'Test system error'
            });
            
            console.log('Error handling test completed');
        } catch (error) {
            console.error('Error in test:', error);
        }
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler };
} else {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = errorHandler;
    
    // Add test function to global scope for debugging
    window.testErrorHandling = () => errorHandler.testErrorHandling();
    window.getErrorStats = () => errorHandler.getErrorStats();
    window.clearErrorLog = () => errorHandler.clearErrorLog();
    window.exportErrorLog = () => errorHandler.exportErrorLog();
    
    // Log error handler initialization
    console.log('ErrorHandler initialized successfully');
}
