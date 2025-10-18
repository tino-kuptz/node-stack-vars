# Stack-Vars Advanced Express Demo

This advanced example demonstrates how to use `stack-vars` across multiple files and modules in a real-world Express.js application. It shows context preservation through authentication, database operations, and logging services.

## Architecture

```
server.js (main application)
├── services/
│   ├── auth.js (authentication service)
│   ├── database.js (database operations)
│   └── logger.js (logging service)
```

## How It Works

1. **Request Middleware**: Sets up request context with ID, method, URL, etc.
2. **Authentication Service**: Handles user authentication and session creation
3. **Database Service**: Performs database operations using context data
4. **Logging Service**: Provides context-aware logging across all services
5. **Audit Service**: Tracks events and maintains audit context
6. **Context Verification**: Confirms context preservation across all services

## Installation

```bash
cd example/express-advanced
npm install
```

## Running the Demo

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

Then open your browser to: http://localhost:3001

## Usage

1. Enter up to 5 usernames (default: "user1", "user2", etc.)
2. Set passwords for each user (default: "pass1", "pass2", etc.)
3. Set timeout durations in seconds (1-10 seconds) for each user
4. Click "Test All Advanced Operations" to send all requests simultaneously
5. Watch as the system processes each request through multiple services

## Service Modules

### Authentication Service (`services/auth.js`)

- `authenticateUser(username, password)` - Authenticates users and sets auth context
- `createSession()` - Creates user sessions with context preservation
- `checkPermissions(permission)` - Validates user permissions using context
- `logoutUser()` - Handles user logout and context cleanup

### Database Service (`services/database.js`)

- `getUserData()` - Retrieves user data using context information
- `createUserSession()` - Creates database session records
- `doDatabaseDummyData()` - **Main function** - Performs comprehensive database operations
- `logAuditEvent(eventType, details)` - Logs audit events with context

### Logging Service (`services/logger.js`)

- `logInfo(message, data)` - Logs info messages with context
- `logError(message, error)` - Logs error messages with context
- `logWarning(message, data)` - Logs warning messages with context
- `sendLogsToExternalService(logs)` - Sends logs to external service
- `aggregateLogs()` - Aggregates logs using context data

## Context Data Preserved

The demo preserves the following context across all services:

- **Request Context**: `requestId`, `method`, `url`, `userAgent`, `startTime`
- **User Context**: `username`, `sessionId`, `isAuthenticated`, `loginTime`
- **Auth Context**: `userId`, `sessionId`, `permissions`, `role`, `isAuthenticated`
- **Logger Context**: `level`, `service`
- **Audit Context**: `service`, `eventCount`, `lastEvent`

## Key Demonstrations

- **Cross-File Context**: How context flows through different service modules
- **Service Layer Pattern**: Real-world architecture with context preservation
- **Complex Async Workflows**: Multiple async operations across services
- **Context Isolation**: Each request maintains its own context across all services
- **Audit Trail**: Complete audit trail with context-aware logging

## API Endpoints

- `GET /` - Serves the advanced demo web interface
- `POST /advanced-login` - Processes login through all services
- `GET /health` - Health check endpoint

## Example Response

```json
{
  "success": true,
  "username": "user1",
  "userId": "user1",
  "sessionId": "session_1703123456789_abc123",
  "requestId": "req_1703123456789_def456",
  "timeout": 3,
  "processingTime": 3100,
  "permissions": ["read", "write", "delete"],
  "contextPreserved": true,
  "servicesUsed": ["auth", "database", "logger", "audit"],
  "loginTime": "2023-12-21T10:30:56.789Z",
  "method": "POST",
  "url": "/advanced-login",
  "auditEventCount": 1,
  "databaseResult": {
    "user": { "id": "user1", "username": "user1", "email": "user1@example.com" },
    "session": { "sessionId": "session_1703123456789_abc123", "userId": "user1" },
    "operationId": "op_1703123456789_xyz789",
    "completedAt": "2023-12-21T10:30:59.789Z"
  },
  "authResult": {
    "success": true,
    "username": "user1",
    "userId": "user1",
    "permissions": ["read", "write", "delete"],
    "role": "user"
  }
}
```

## Advanced Features Demonstrated

1. **Service Layer Architecture**: Clean separation of concerns with context preservation
2. **Cross-Module Context Access**: Services access context data from other modules
3. **Complex Async Workflows**: Multiple async operations with context preservation
4. **Audit Trail**: Complete audit trail with context-aware event logging
5. **Error Handling**: Context-aware error handling across all services
6. **Performance Monitoring**: Context-aware performance tracking

This advanced example demonstrates that `stack-vars` is not just a simple context manager, but a powerful tool for building maintainable, context-aware applications with clean architecture patterns.
