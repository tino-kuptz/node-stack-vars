import stackVars from 'stack-vars';

/**
 * Database service module demonstrating stack-vars usage across files
 * This simulates database operations while preserving context
 */

/**
 * Simulates a database query that retrieves user data
 * Uses stack-vars to access the current request context
 */
export async function getUserData() {
  // Simulate database connection delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Access context from stack-vars
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Database: Retrieving data for user: ${username}`);
  
  // Simulate database query
  const userData = {
    id: username,
    username: username,
    email: `${username}@example.com`,
    role: 'user',
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'light',
      notifications: true
    }
  };
  
  // Simulate additional processing time
  await new Promise(resolve => setTimeout(resolve, 50));
  
  console.log(`[${requestId}] Database: Retrieved data for user: ${username}`);
  
  return userData;
}

/**
 * Simulates a database operation that creates user session
 * Demonstrates context preservation across async operations
 */
export async function createUserSession() {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Database: Creating session for user: ${username}`);
  
  // Simulate database write operation
  await new Promise(resolve => setTimeout(resolve, 75));
  
  const sessionData = {
    sessionId: stackVars().sessionId,
    userId: username,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    ipAddress: '127.0.0.1',
    userAgent: stackVars().userAgent
  };
  
  console.log(`[${requestId}] Database: Created session for user: ${username}`);
  
  return sessionData;
}

/**
 * Simulates a complex database operation with multiple async steps
 * Shows how context is preserved through nested async operations
 */
export async function doDatabaseDummyData() {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Database: Starting dummy data operation for user: ${username}`);
  
  // Step 1: Get user data
  const userData = await getUserData();
  
  // Step 2: Create session
  const sessionData = await createUserSession();
  
  // Step 3: Simulate additional database operations
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 4: Log activity (using logger context)
  const loggerCtx = stackVars('logger');
  console.log(`[${requestId}] Database: Completed dummy data operation for user: ${username} with service: ${loggerCtx.service || 'unknown'}`);
  
  return {
    user: userData,
    session: sessionData,
    operationId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    completedAt: new Date().toISOString()
  };
}

/**
 * Simulates a database audit log operation
 * Uses named context for audit logging
 */
export async function logAuditEvent(eventType, details) {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  // Use audit context
  const auditCtx = stackVars('audit');
  if (auditCtx) {
    auditCtx.lastEvent = eventType;
    auditCtx.eventCount = (auditCtx.eventCount || 0) + 1;
  }
  
  const auditLog = {
    eventId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    username,
    requestId,
    details,
    timestamp: new Date().toISOString(),
    eventCount: auditCtx ? auditCtx.eventCount : 0
  };
  
  console.log(`[${requestId}] Audit: ${eventType} for user: ${username}`);
  
  // Simulate database write
  await new Promise(resolve => setTimeout(resolve, 25));
  
  return auditLog;
}