import { AsyncLocalStorage } from 'async_hooks';

// Single AsyncLocalStorage instance for all contexts
const store = new AsyncLocalStorage();

/**
 * Get the current store object (contains all contexts)
 * @returns {object|null} The store object with all contexts, or null if not in a context
 */
function getStore() {
    return store.getStore();
}

/**
 * Initialize a new context and run the callback within it
 * @param {string|string[]|function|object} nameOrCallback - Context name(s), callback function, or options object
 * @param {function} callback - The callback function to run within the context
 * @returns {Promise} Promise that resolves when the callback completes
 */
function init(nameOrCallback, callback) {
    let contextNames = ['default'];
    let cb = nameOrCallback;

    // Handle different parameter patterns
    if (Array.isArray(nameOrCallback)) {
        contextNames = nameOrCallback;
        cb = callback;
    } else if (typeof nameOrCallback === 'string') {
        contextNames = [nameOrCallback];
        cb = callback;
    } else if (typeof nameOrCallback === 'object' && nameOrCallback !== null) {
        if (Array.isArray(nameOrCallback.name)) {
            contextNames = nameOrCallback.name;
        } else {
            contextNames = [nameOrCallback.name || 'default'];
        }
        cb = callback;
    } else if (typeof nameOrCallback === 'function') {
        cb = nameOrCallback;
    }

    if (typeof cb !== 'function') {
        throw new Error('Callback function is required');
    }

    // Validate context names
    if (!Array.isArray(contextNames) || contextNames.length === 0) {
        throw new Error('Context names must be a non-empty array');
    }

    // Validate that all context names are strings
    for (const contextName of contextNames) {
        if (typeof contextName !== 'string') {
            throw new Error('Context names must be strings');
        }
    }

    // Get parent store (if any)
    const parentStore = getStore();
    
    // Create new store object with all contexts
    const newStore = parentStore ? { ...parentStore } : {};
    
    // Initialize requested contexts
    for (const contextName of contextNames) {
        if (!newStore[contextName]) {
            newStore[contextName] = {};
        }
    }

    return new Promise((resolve, reject) => {
        store.run(newStore, () => {
            try {
                const result = cb();
                if (result && typeof result.then === 'function') {
                    result.then(resolve).catch(reject);
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Get a proxy object for the current context
 * @param {string} contextName - The name of the context (default: 'default')
 * @returns {Proxy} A proxy object for the current context
 */
function getContext(contextName = 'default') {
    const currentStore = getStore();
    
    if (!currentStore || !currentStore[contextName]) {
        // Return a proxy that throws an error when accessed outside of a context
        return new Proxy({}, {
            get(target, prop) {
                throw new Error(`Context '${contextName}' is not available. Make sure to call stackVars.init() first.`);
            },
            set(target, prop, value) {
                throw new Error(`Context '${contextName}' is not available. Make sure to call stackVars.init() first.`);
            },
            has(target, prop) {
                return false;
            }
        });
    }

    const context = currentStore[contextName];

    return new Proxy(context, {
        get(target, prop) {
            if (prop === Symbol.toPrimitive) {
                return () => context;
            }
            return target[prop];
        },

        set(target, prop, value) {
            target[prop] = value;
            return true;
        },

        has(target, prop) {
            return prop in target;
        },

        ownKeys(target) {
            return Object.keys(target);
        },

        getOwnPropertyDescriptor(target, prop) {
            return Object.getOwnPropertyDescriptor(target, prop);
        }
    });
}

/**
 * Main stackVars function
 * @param {string} contextName - The name of the context (default: 'default')
 * @returns {Proxy} A proxy object for the current context
 */
function stackVars(contextName = 'default') {
    return getContext(contextName);
}

/**
 * Check if a context exists
 * @param {string} contextName - The name of the context to check
 * @returns {boolean} True if the context exists, false otherwise
 */
function has(contextName) {
    if (typeof contextName !== 'string') {
        throw new Error('Context name must be a string');
    }

    const currentStore = getStore();
    return currentStore !== null && currentStore !== undefined && currentStore[contextName] !== undefined;
}

// Attach init method to the main function
stackVars.init = init;

// Attach has method to the main function
stackVars.has = has;

// Attach default context as a property for convenience
Object.defineProperty(stackVars, 'default', {
    get() {
        return getContext('default');
    }
});

export default stackVars;