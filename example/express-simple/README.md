# Stack-Vars Express Demo

This example demonstrates how to use `stack-vars` in an Express.js web server to maintain context across async operations, simulating multiple concurrent login requests.

## Installation

```bash
cd example/express-simple
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

Then open your browser to: http://localhost:3000

## Usage

1. Enter up to 5 usernames (default: "user1", "user2", etc.)
2. Set timeout durations in seconds (1-10 seconds) for each user
3. Click "Test All Logins" to send all requests simultaneously
4. Watch as the system:
   - Authenticates all users concurrently
   - Waits for the specified time for each user
   - Returns session information as each completes
   - Confirms context was preserved for each request

## Key Demonstrations

This demo shows how context flows through middleware and route handlers, even remains available after `setTImeout` operations and uses named contexts for different concerns.

## API Endpoints

- `GET /` - Serves the demo web interface
- `POST /login` - Simulates login with context preservation
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
  "permissions": ["read", "write"],
  "contextPreserved": true,
  "loginTime": "2023-12-21T10:30:56.789Z",
  "method": "POST",
  "url": "/login"
}
```

This demonstrates that all context data is preserved even after waiting for 3 seconds, proving the effectiveness of `stack-vars` for maintaining context across async operations in Express.js applications.
