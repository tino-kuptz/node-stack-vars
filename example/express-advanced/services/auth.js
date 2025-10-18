import stackVars from 'stack-vars';

/**
 * Authentication service module demonstrating stack-vars usage
 * This simulates authentication operations while preserving context
 */

/**
 * Simulates user authentication
 * Uses stack-vars to access and set context data
 */
export async function authenticateUser(username, password) {
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Auth: Authenticating user: ${username}`);
  
  // Simulate authentication delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Simulate password validation
  if (!password || password.length < 3) {
    throw new Error('Invalid password');
  }
  
  // Set authentication context
  const authCtx = stackVars('auth');
  if (authCtx) {
    authCtx.isAuthenticated = true;
    authCtx.userId = username;
    authCtx.authenticatedAt = new Date().toISOString();
    authCtx.permissions = ['read', 'write', 'delete'];
    authCtx.role = 'user';
  }
  
  // Set user context
  stackVars().username = username;
  stackVars().isAuthenticated = true;
  stackVars().loginTime = Date.now();
  
  console.log(`[${requestId}] Auth: User ${username} authenticated successfully`);
  
  return {
    success: true,
    username,
    userId: username,
    permissions: authCtx ? authCtx.permissions : ['read'],
    role: authCtx ? authCtx.role : 'user',
    authenticatedAt: authCtx ? authCtx.authenticatedAt : new Date().toISOString()
  };
}

/**
 * Simulates session creation
 * Demonstrates context preservation across async operations
 */
export async function createSession() {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Auth: Creating session for user: ${username}`);
  
  // Simulate session creation delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set session context
  stackVars().sessionId = sessionId;
  
  const authCtx = stackVars('auth');
  if (authCtx) {
    authCtx.sessionId = sessionId;
    authCtx.sessionCreatedAt = new Date().toISOString();
  }
  
  console.log(`[${requestId}] Auth: Session created for user: ${username}: ${sessionId}`);
  
  return {
    sessionId,
    userId: username,
    createdAt: authCtx ? authCtx.sessionCreatedAt : new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

/**
 * Simulates permission checking
 * Uses context data to determine user permissions
 */
export async function checkPermissions(requiredPermission) {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  const authCtx = stackVars('auth');
  
  console.log(`[${requestId}] Auth: Checking permission '${requiredPermission}' for user: ${username}`);
  
  // Simulate permission check delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const hasPermission = authCtx && authCtx.permissions && authCtx.permissions.includes(requiredPermission);
  
  console.log(`[${requestId}] Auth: User ${username} ${hasPermission ? 'has' : 'does not have'} permission '${requiredPermission}'`);
  
  return {
    hasPermission,
    username,
    permission: requiredPermission,
    userPermissions: authCtx ? authCtx.permissions : []
  };
}

/**
 * Simulates user logout
 * Clears authentication context
 */
export async function logoutUser() {
  const username = stackVars().username;
  const requestId = stackVars().requestId;
  
  console.log(`[${requestId}] Auth: Logging out user: ${username}`);
  
  // Simulate logout delay
  await new Promise(resolve => setTimeout(resolve, 75));
  
  // Clear authentication context
  const authCtx = stackVars('auth');
  if (authCtx) {
    authCtx.isAuthenticated = false;
    authCtx.loggedOutAt = new Date().toISOString();
  }
  
  // Clear user context
  stackVars().isAuthenticated = false;
  stackVars().sessionId = null;
  
  console.log(`[${requestId}] Auth: User ${username} logged out successfully`);
  
  return {
    success: true,
    username,
    loggedOutAt: authCtx ? authCtx.loggedOutAt : new Date().toISOString()
  };
}