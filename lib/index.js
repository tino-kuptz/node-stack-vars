import { AsyncLocalStorage } from 'async_hooks';

// Create AsyncLocalStorage instances for different contexts
const contextStores = new Map();
const STORAGE_PREFIX = 'stack-vars-';

/**
 * Get or create an AsyncLocalStorage instance for a specific context name
 * @param {string} contextName - The name of the context
 * @returns {AsyncLocalStorage} The AsyncLocalStorage instance
 */
function getContextStore(contextName) {
    const prefixedName = `${STORAGE_PREFIX}${contextName}`;
    if (!contextStores.has(prefixedName)) {
        contextStores.set(prefixedName, new AsyncLocalStorage());
    }
    return contextStores.get(prefixedName);
}

/**
 * Initialize a new context and run the callback within it
 * @param {string|string[]|function|object} nameOrCallback - Cotnext name(s), callback function, or options object
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

    // For multiple contexts, we need to create a special multi-context store
    if (contextNames.length === 1) {
        // Single context - use original logic
        const contextName = contextNames[0];
        const store = getContextStore(contextName);
        const context = {};

        return new Promise((resolve, reject) => {
            store.run(context, () => {
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
    } else {
        // Multiple contexts - create a special multi-context
        const multiContextName = `multi_${contextNames.join('_')}`;
        const store = getContextStore(multiContextName);
        
        // Create a context object that contains all the individual contexts
        const multiContext = {
            _contextNames: contextNames,
            _contexts: {}
        };
        
        // Initialize all contexts
        for (const contextName of contextNames) {
            multiContext._contexts[contextName] = {};
        }

        return new Promise((resolve, reject) => {
            store.run(multiContext, () => {
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
}

/**
 * Get a proxy object for the current context
 * @param {string} contextName - The name of the context (default: 'default')
 * @returns {Proxy} A proxy object for the current context
 */
function getContext(contextName = 'default') {
    // First, try to get the context from its own store
    const store = getContextStore(contextName);
    let context = store.getStore();

    // If not found, check if we're in a multi-context
    if (!context) {
        // Check all possible multi-context stores
        for (const [storeName, multiStore] of contextStores.entries()) {
            if (storeName.startsWith(`${STORAGE_PREFIX}multi_`)) {
                const multiContext = multiStore.getStore();
                if (multiContext && multiContext._contextNames && multiContext._contextNames.includes(contextName)) {
                    context = multiContext._contexts[contextName];
                    break;
                }
            }
        }
    }

    if (!context) {
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
 * @param {string} contextName - The name of the cotnext (default: 'default')
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

    // First, try to get the context from its own store
    const store = getContextStore(contextName);
    let context = store.getStore();

    // If not found, check if we're in a multi-context
    if (!context) {
        // Check all possible multi-context stores
        for (const [storeName, multiStore] of contextStores.entries()) {
            if (storeName.startsWith(`${STORAGE_PREFIX}multi_`)) {
                const multiContext = multiStore.getStore();
                if (multiContext && multiContext._contextNames && multiContext._contextNames.includes(contextName)) {
                    return true;
                }
            }
        }
    }

    return context !== null && context !== undefined;
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