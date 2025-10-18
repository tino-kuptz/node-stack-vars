import stackVars from 'stack-vars';

/**
 * Logging service module demonstrating stack-vars usage
 * This simulates logging operations while preserving context
 */

/**
 * Logs an info message using context data
 */
export function logInfo(message, data = {}) {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  const loggerCtx = stackVars('logger');
  
  const logEntry = {
    level: 'info',
    message,
    requestId,
    username,
    service: loggerCtx ? loggerCtx.service : 'unknown',
    timestamp: new Date().toISOString(),
    data
  };
  
  console.log(`[${requestId}] INFO: ${message}`, data);
  
  return logEntry;
}

/**
 * Logs an error message using context data
 */
export function logError(message, error = null) {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  const loggerCtx = stackVars('logger');
  
  const logEntry = {
    level: 'error',
    message,
    requestId,
    username,
    service: loggerCtx ? loggerCtx.service : 'unknown',
    timestamp: new Date().toISOString(),
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null
  };
  
  console.error(`[${requestId}] ERROR: ${message}`, error);
  
  return logEntry;
}

/**
 * Logs a warning message using context data
 */
export function logWarning(message, data = {}) {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  const loggerCtx = stackVars('logger');
  
  const logEntry = {
    level: 'warning',
    message,
    requestId,
    username,
    service: loggerCtx ? loggerCtx.service : 'unknown',
    timestamp: new Date().toISOString(),
    data
  };
  
  console.warn(`[${requestId}] WARNING: ${message}`, data);
  
  return logEntry;
}

/**
 * Logs a debug message using context data
 */
export function logDebug(message, data = {}) {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  const loggerCtx = stackVars('logger');
  
  const logEntry = {
    level: 'debug',
    message,
    requestId,
    username,
    service: loggerCtx ? loggerCtx.service : 'unknown',
    timestamp: new Date().toISOString(),
    data
  };
  
  console.log(`[${requestId}] DEBUG: ${message}`, data);
  
  return logEntry;
}

/**
 * Simulates sending logs to external service
 * Demonstrates context preservation across async operations
 */
export async function sendLogsToExternalService(logs) {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  
  console.log(`[${requestId}] Logger: Sending ${logs.length} logs to external service for user: ${username}`);
  
  // Simulate external service call
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const result = {
    success: true,
    logsSent: logs.length,
    requestId,
    username,
    sentAt: new Date().toISOString()
  };
  
  console.log(`[${requestId}] Logger: Successfully sent logs to external service for user: ${username}`);
  
  return result;
}

/**
 * Simulates log aggregation operation
 * Uses context data to group and process logs
 */
export async function aggregateLogs() {
  const requestId = stackVars().requestId;
  const username = stackVars().username;
  const loggerCtx = stackVars('logger');
  
  console.log(`[${requestId}] Logger: Aggregating logs for user: ${username}`);
  
  // Simulate aggregation delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const aggregatedLogs = {
    requestId,
    username,
    service: loggerCtx ? loggerCtx.service : 'unknown',
    logCount: Math.floor(Math.random() * 10) + 1,
    aggregatedAt: new Date().toISOString(),
    timeRange: {
      start: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      end: new Date().toISOString()
    }
  };
  
  console.log(`[${requestId}] Logger: Aggregated ${aggregatedLogs.logCount} logs for user: ${username}`);
  
  return aggregatedLogs;
}