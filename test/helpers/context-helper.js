/**
 * Helper functions for testing context availability across files
 */

import stackVars from '../../lib/index.js';

/**
 * Sets a value in the default context
 * @param {string} key - The key to set
 * @param {any} value - The value to set
 */
export function setContextValue(key, value) {
  stackVars()[key] = value;
}

/**
 * Gets a value from the default context
 * @param {string} key - The key to get
 * @returns {any} The value from context
 */
export function getContextValue(key) {
  return stackVars()[key];
}

/**
 * Sets a value in a named context
 * @param {string} contextName - The name of the context
 * @param {string} key - The key to set
 * @param {any} value - The value to set
 */
export function setNamedContextValue(contextName, key, value) {
  stackVars(contextName)[key] = value;
}

/**
 * Gets a value from a named context
 * @param {string} contextName - The name of the context
 * @param {string} key - The key to get
 * @returns {any} The value from context
 */
export function getNamedContextValue(contextName, key) {
  return stackVars(contextName)[key];
}

/**
 * Gets all keys from the default context
 * @returns {string[]} Array of keys
 */
export function getContextKeys() {
  return Object.keys(stackVars());
}

/**
 * Gets all keys from a named context
 * @param {string} contextName - The name of the context
 * @returns {string[]} Array of keys
 */
export function getNamedContextKeys(contextName) {
  return Object.keys(stackVars(contextName));
}

/**
 * Simulates a database operation that uses context
 * @param {string} operation - The operation name
 * @returns {Object} Result with context data
 */
export function simulateDatabaseOperation(operation) {
  return {
    operation,
    requestId: stackVars().requestId,
    userId: stackVars().userId,
    timestamp: Date.now()
  };
}

/**
 * Simulates a logging function that uses context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted log entry
 */
export function logWithContext(level, message) {
  return `[${stackVars().requestId}] [${level}] ${message}`;
}