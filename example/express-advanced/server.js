import express from 'express';
import stackVars from 'stack-vars';
import { doDatabaseDummyData, logAuditEvent } from './services/database.js';
import { authenticateUser, createSession, checkPermissions } from './services/auth.js';
import { logInfo, logError, logWarning, sendLogsToExternalService } from './services/logger.js';

const app = express();
const PORT = 3001;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    stackVars.init({ name: ['default', 'auth'] }, () => {
        next();
    });
});

// Advanced login endpoint that demonstrates stack-vars across multiple files
app.post('/advanced-login', async (req, res) => {
    const { username, password, timeout } = req.body;

    // stackVars.init was called in the middleware to cerate "default" and "auth" contexts
    // stackVars.init was called around app.listen at the bottom of the file to create "logger" and "audit" contexts
    try {
        // Set request context variables
        stackVars().requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        stackVars().method = req.method;
        stackVars().url = req.url;
        stackVars().userAgent = req.headers['user-agent'];
        stackVars().startTime = Date.now();

        logInfo('Starting advanced login process', { username, timeout });

        // Step 1: Authenticate user (using auth service)
        return authenticateUser(username, password).then(authResult => {
            logInfo('User authenticated', authResult);

            // Step 2: Create session (using auth service)
            return createSession().then(sessionResult => {
                logInfo('Session created', sessionResult);

                // Step 3: Check permissions (using auth service)
                return checkPermissions('read').then(permissionResult => {
                    logInfo('Permission checked', permissionResult);

                    // Step 4: Wait for specified timeout
                    logInfo('Starting timeout period', { timeout });
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            // Step 5: Perform database operations (using database service)
                            doDatabaseDummyData().then(dbResult => {
                                logInfo('Database operations completed', dbResult);

                                // Step 6: Log audit event (using database service)
                                return logAuditEvent('LOGIN_SUCCESS', {
                                    username,
                                    sessionId: sessionResult.sessionId,
                                    timeout
                                }).then(auditResult => {
                                    logInfo('Audit event logged', auditResult);

                                    // Step 7: Send logs to external service (using logger service)
                                    const logs = [
                                        logInfo('Login process completed successfully'),
                                        logInfo('All services executed successfully')
                                    ];
                                    return sendLogsToExternalService(logs).then(logResult => {
                                        logInfo('Logs sent to external service', logResult);

                                        // Verify context is still preserved after all operations
                                        const endTime = Date.now();
                                        const processingTime = endTime - stackVars().startTime;

                                        const authCtx = stackVars('auth');
                                        const loggerCtx = stackVars('logger');
                                        const auditCtx = stackVars('audit');

                                        const contextPreserved =
                                            stackVars().username === username &&
                                            stackVars().sessionId === sessionResult.sessionId &&
                                            (authCtx ? authCtx.isAuthenticated : false) &&
                                            (loggerCtx ? loggerCtx.service === 'express-advanced-demo' : false);

                                        logInfo('Advanced login completed', {
                                            username,
                                            processingTime,
                                            contextPreserved,
                                            servicesUsed: ['auth', 'database', 'logger', 'audit']
                                        });

                                        // Return comprehensive result
                                        res.json({
                                            success: true,
                                            username: stackVars().username,
                                            userId: authCtx ? authCtx.userId : username,
                                            sessionId: stackVars().sessionId,
                                            requestId: stackVars().requestId,
                                            timeout: timeout,
                                            processingTime: processingTime,
                                            permissions: authCtx ? authCtx.permissions : ['read'],
                                            contextPreserved: contextPreserved,
                                            servicesUsed: ['auth', 'database', 'logger', 'audit'],
                                            loginTime: new Date(stackVars().loginTime).toISOString(),
                                            method: stackVars().method,
                                            url: stackVars().url,
                                            auditEventCount: auditCtx ? auditCtx.eventCount : 0,
                                            databaseResult: dbResult,
                                            authResult: authResult
                                        });

                                        resolve();
                                    });
                                });
                            });
                        }, timeout * 1000);
                    });
                });
            });
        });

    } catch (error) {
        logError('Error in advanced login', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'express-advanced-demo'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logError('Unhandled error', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Serve the HTML form
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stack-Vars Advanced Express Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .info {
            background-color: #d1ecf1;
            border-left-color: #17a2b8;
            color: #0c5460;
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #17a2b8;
        }
        .test-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .test-table th, .test-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .test-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #495057;
        }
        .test-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .test-table tr:hover {
            background-color: #e9ecef;
        }
        input[type="text"], input[type="password"], input[type="number"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input[type="text"]:focus, input[type="password"]:focus, input[type="number"]:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .result-cell {
            min-height: 40px;
            vertical-align: top;
        }
        .result-success {
            background-color: #d4edda;
            color: #155724;
            padding: 8px;
            border-radius: 4px;
            border-left: 3px solid #28a745;
        }
        .result-error {
            background-color: #f8d7da;
            color: #721c24;
            padding: 8px;
            border-radius: 4px;
            border-left: 3px solid #dc3545;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-pending {
            background-color: #ffc107;
            animation: pulse 1.5s infinite;
        }
        .status-success {
            background-color: #28a745;
        }
        .status-error {
            background-color: #dc3545;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .summary {
            margin-top: 20px;
            padding: 15px;
            background-color: #e9ecef;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Stack-Vars Advanced Express Demo</h1>
        
        <div class="info">
            <strong>How it works:</strong> This advanced demo shows how stack-vars works across multiple files and modules. 
            Each request goes through authentication, database operations, and logging services - all while preserving 
            context across async operations and file boundaries. This demonstrates real-world usage patterns!
        </div>
        
        <table class="test-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Timeout (seconds)</th>
                    <th>Server Response</th>
                </tr>
            </thead>
            <tbody id="testRows">
                <!-- Rows will be generated by JavaScript -->
            </tbody>
        </table>
        
        <button id="testButton" onclick="runAllTests()">Test All Advanced Operations</button>
        
        <div id="summary" class="summary" style="display: none;">
            <h3>Test Summary</h3>
            <div id="summaryContent"></div>
        </div>
    </div>

    <script>
        // Generate table rows
        function generateTableRows() {
            const tbody = document.getElementById('testRows');
            tbody.innerHTML = '';
            
            for (let i = 1; i <= 5; i++) {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td>\${i}</td>
                    <td><input type="text" id="username\${i}" value="user\${i}" placeholder="Enter username"></td>
                    <td><input type="password" id="password\${i}" value="pass\${i}" placeholder="Enter password"></td>
                    <td><input type="number" id="timeout\${i}" value="\${i + 1}" min="1" max="10" placeholder="Timeout"></td>
                    <td class="result-cell" id="result\${i}">Ready to test</td>
                \`;
                tbody.appendChild(row);
            }
        }
        
        // Run all tests
        async function runAllTests() {
            const button = document.getElementById('testButton');
            const summary = document.getElementById('summary');
            const summaryContent = document.getElementById('summaryContent');
            
            button.disabled = true;
            button.textContent = 'Testing...';
            summary.style.display = 'none';
            
            // Clear previous results
            for (let i = 1; i <= 5; i++) {
                const resultCell = document.getElementById(\`result\${i}\`);
                resultCell.innerHTML = '<span class="status-indicator status-pending"></span>Processing...';
            }
            
            const startTime = Date.now();
            const promises = [];
            
            // Create promises for all requests
            for (let i = 1; i <= 5; i++) {
                const username = document.getElementById(\`username\${i}\`).value;
                const password = document.getElementById(\`password\${i}\`).value;
                const timeout = document.getElementById(\`timeout\${i}\`).value;
                
                if (username.trim() && password.trim()) {
                    const promise = sendAdvancedRequest(i, username, password, parseInt(timeout) || 1);
                    promises.push(promise);
                }
            }
            
            // Wait for all requests to complete
            try {
                const results = await Promise.allSettled(promises);
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                
                // Update summary
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                summaryContent.innerHTML = \`
                    <p><strong>Total Requests:</strong> \${promises.length}</p>
                    <p><strong>Successful:</strong> \${successful}</p>
                    <p><strong>Failed:</strong> \${failed}</p>
                    <p><strong>Total Time:</strong> \${totalTime}ms</p>
                \`;
                summary.style.display = 'block';
                
            } catch (error) {
                console.error('Error in test execution:', error);
            }
            
            button.disabled = false;
            button.textContent = 'Test All Advanced Operations';
        }
        
        // Send individual advanced request
        async function sendAdvancedRequest(index, username, password, timeout) {
            const resultCell = document.getElementById(\`result\${index}\`);
            
            try {
                const response = await fetch('/advanced-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password, timeout })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultCell.innerHTML = \`
                        <div class="result-success">
                            <span class="status-indicator status-success"></span>
                            <strong>Success</strong><br>
                            <small>User: \${data.username}</small><br>
                            <small>User ID: \${data.userId}</small><br>
                            <small>Session: \${data.sessionId ? data.sessionId.substring(0, 12) : ''}...</small><br>
                            <small>Time: \${data.processingTime}ms</small><br>
                            <small>Context: \${data.contextPreserved ? 'Yes' : 'No'}</small><br>
                            <small>Services: \${data.servicesUsed ? data.servicesUsed.join(', ') : ''}</small>
                        </div>
                    \`;
                } else {
                    resultCell.innerHTML = \`
                        <div class="result-error">
                            <span class="status-indicator status-error"></span>
                            <strong>Error</strong><br>
                            <small>\${data.error}</small>
                        </div>
                    \`;
                }
            } catch (error) {
                resultCell.innerHTML = \`
                    <div class="result-error">
                        <span class="status-indicator status-error"></span>
                        <strong>Network Error</strong><br>
                        <small>\${error.message}</small>
                    </div>
                \`;
            }
        }
        
        // Initialize the page
        generateTableRows();
    </script>
</body>
</html>
  `;

    res.send(html);
});

// Start the server

// Set up logging context
stackVars.init(['logger', 'audit'], () => {
    stackVars('logger').level = 'info';
    stackVars('logger').service = 'express-advanced-demo';
    stackVars('audit').service = 'express-advanced-demo';
    stackVars('audit').eventCount = 0;
    app.listen(PORT, () => {
        console.log(`Stack-Vars Advanced Express Demo Server running on http://localhost:${PORT}`);
        console.log(`Open your browser and navigate to http://localhost:${PORT}`);
        console.log(`This demo shows how stack-vars preserves context across multiple files and services`);
    });
});