# stack-vars
A Node.js module for creating stack-like variable contexts using async hooks. Store and retrieve variables across async boundaries with full control over inheritance behavior.
## Installation
```bash
npm install stack-vars
```
## Quick Start
```js
import stackVars from 'stack-vars';

var examle = () => {
    // Outputs 15
    console.log(stackVars().userId); 
}

// Start a new context
stackVars.init(() => {
    stackVar().userId = 15;

    setTimeout(() => {
        // Outputs 15
        console.log(stackVars().userId); 
        new Promise((res) => {
            example();
            res();
        })
    }, 1000);
})

// Is undefined
console.log(stackVars().userId); 
```
It can also create different contexts with different names:
```js
// Creates "default"
stackVars.init(() => {
    stackVars.init('user', () => {
        stackVars().id = 15; // dets for "default"
        stackVars('user').id = 15; // sets for "user"
    })
})
```
## How It Works
`stack-vars` uses Node.js [async local storage](https://nodejs.org/api/async_context.html) to create execution contexts that persist across async operations. Variables set in one context are automatically available in nested async operations, making it perfect for request tracing, logging, and state management.  
It is stable since node.js V13
## Basic Usage
### Setting and Getting Variables
```js

```
### Named Contexts
Create multiple isolated contexts within the same execution:

```js

```
## API Reference
### `stackVars.init()`
Creates a new context

**Parameters:**  
one of:
- `cb` (function): The function in which the context is available

or:
- `name` (string): The context name
- `cb` (function): The function in which the context is available

or:
- `names` (string[]): Array of context names to create
- `cb` (function): The function in which the contexts are available

or:
- `properties` (object): The context configuration
    - `name` (string|string[]): Context name(s) (default: "default")
- `cb` (function): The function in which the context(s) are available

**Returns:** a promise, resolving when the inner callback did resolve.

**Examples:**
```js
// Single context
stackVars.init(() => {
    stackVars().value = 'test';
});

// Named context
stackVars.init('user', () => {
    stackVars('user').id = 123;
});

// Multiple contexts
stackVars.init(['auth', 'user', 'session'], () => {
    stackVars('auth').token = 'abc123';
    stackVars('user').id = 456;
    stackVars('session').expires = Date.now() + 3600000;
});

// Multiple contexts with object syntax
stackVars.init({name: ['auth', 'user']}, () => {
    stackVars('auth').token = 'abc123';
    stackVars('user').id = 456;
});
```
### `stackVars.has()`
Check if a context exists

**Parameters:**  
- `contextName` (string): The name of the context to check

**Returns:** `boolean` - True if the context exists, false otherwise

**Examples:**
```js
// Check if default context exists
stackVars.init(() => {
    console.log(stackVars.has('default')); // true
    console.log(stackVars.has('user'));    // false
});

// Check if named context exists
stackVars.init('user', () => {
    console.log(stackVars.has('user'));    // true
    console.log(stackVars.has('auth'));    // false
});

// Check multiple contexts
stackVars.init(['auth', 'user'], () => {
    console.log(stackVars.has('auth'));    // true
    console.log(stackVars.has('user'));    // true
    console.log(stackVars.has('session')); // false
});

// Check outside of context
console.log(stackVars.has('default')); // false
console.log(stackVars.has('user'));    // false

// Invalid context names throw errors
try {
  stackVars.has(null); // throws "Context name must be a string"
} catch (error) {
  console.log(error.message);
}
```
## Use Cases
### Request Tracing
Example for express
```js
import stackVars from 'stack-vars';

// Middleware to set request context
app.use((req, res, next) => {
    stackVars.init(() => {
        stackVars().requestId = req.headers['x-request-id'];
        stackVars().userId = req.user?.id;
        stackVars().startTime = Date.now();
        next();
    })
});

// Use in any route handler or service
app.get('/api/users', (req, res) => {
    const requestId = stackVars().requestId;
    const userId = stackVars().userId;
    
    // Log with context
    console.log(`[${requestId}] User ${userId} requested users list`);
    
    // Pass to services
    userService.getUsers().then(users => {
        console.log(`[${requestId}] Returning ${users.length} users`);
        res.json(users);
    });
});
```

## Actual working examples
In `/example` there are two examples demonstating how to use stackVars() with express.
### express-simple
Basicly just the code above
### express-advanced
More detailed example using multiple files and contexts
## License
MIT