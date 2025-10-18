import { expect } from 'chai';
import stackVars from '../lib/index.js';
import { 
  setContextValue, 
  getContextValue, 
  setNamedContextValue, 
  getNamedContextValue,
  getContextKeys,
  getNamedContextKeys,
  simulateDatabaseOperation,
  logWithContext
} from './helpers/context-helper.js';

describe('Cross-File Context Tests', () => {
  it('should access context from helper function in different file', async () => {
    let result;
    
    await stackVars.init(() => {
      // Set values in main test file
      stackVars().requestId = 'req-123';
      stackVars().userId = 456;
      
      // Use helper function to set additional values
      setContextValue('operation', 'test-operation');
      setContextValue('timestamp', Date.now());
      
      // Use helper function to get values
      result = {
        requestId: getContextValue('requestId'),
        userId: getContextValue('userId'),
        operation: getContextValue('operation'),
        timestamp: getContextValue('timestamp')
      };
    });
    
    expect(result.requestId).to.equal('req-123');
    expect(result.userId).to.equal(456);
    expect(result.operation).to.equal('test-operation');
    expect(result.timestamp).to.be.a('number');
  });

  it('should access named contexts from helper function', async () => {
    let userResult, sessionResult;
    
    await stackVars.init(() => {
      // Set up default context
      stackVars().app = 'test-app';
      
      // Create named contexts first
      return stackVars.init('user', () => {
        // Use helper functions for named contexts
        setNamedContextValue('user', 'id', 789);
        setNamedContextValue('user', 'name', 'Alice');
        
        // Get values using helper functions
        userResult = {
          id: getNamedContextValue('user', 'id'),
          name: getNamedContextValue('user', 'name')
        };
        
        return stackVars.init('session', () => {
          setNamedContextValue('session', 'token', 'abc123');
          setNamedContextValue('session', 'expires', Date.now() + 3600000);
          
          sessionResult = {
            token: getNamedContextValue('session', 'token'),
            expires: getNamedContextValue('session', 'expires')
          };
        });
      });
    });
    
    expect(userResult.id).to.equal(789);
    expect(userResult.name).to.equal('Alice');
    expect(sessionResult.token).to.equal('abc123');
    expect(sessionResult.expires).to.be.a('number');
  });

  it('should get context keys from helper function', async () => {
    let defaultKeys, userKeys;
    
    await stackVars.init(() => {
      // Set up default context
      stackVars().requestId = 'req-456';
      stackVars().userId = 101;
      stackVars().method = 'POST';
      
      // Create named context first
      return stackVars.init('user', () => {
        setNamedContextValue('user', 'id', 202);
        setNamedContextValue('user', 'role', 'admin');
        
        // Get keys using helper functions
        defaultKeys = getContextKeys();
        userKeys = getNamedContextKeys('user');
      });
    });
    
    expect(defaultKeys).to.include('requestId');
    expect(defaultKeys).to.include('userId');
    expect(defaultKeys).to.include('method');
    expect(userKeys).to.include('id');
    expect(userKeys).to.include('role');
  });

  it('should simulate database operation with context from helper', async () => {
    let dbResult;
    
    await stackVars.init(() => {
      stackVars().requestId = 'req-789';
      stackVars().userId = 303;
      
      // Simulate database operation using helper
      dbResult = simulateDatabaseOperation('SELECT');
    });
    
    expect(dbResult.operation).to.equal('SELECT');
    expect(dbResult.requestId).to.equal('req-789');
    expect(dbResult.userId).to.equal(303);
    expect(dbResult.timestamp).to.be.a('number');
  });

  it('should log with context from helper function', async () => {
    let logEntry;
    
    await stackVars.init(() => {
      stackVars().requestId = 'req-999';
      
      // Log using helper function
      logEntry = logWithContext('INFO', 'Processing request');
    });
    
    expect(logEntry).to.equal('[req-999] [INFO] Processing request');
  });

  it('should handle async operations across files', async () => {
    let results = [];
    
    await stackVars.init(() => {
      stackVars().requestId = 'req-async';
      stackVars().userId = 404;
      
      // Simulate async operations that use helper functions
      return Promise.all([
        new Promise(resolve => {
          setTimeout(() => {
            const dbResult = simulateDatabaseOperation('INSERT');
            results.push(dbResult);
            resolve();
          }, 10);
        }),
        new Promise(resolve => {
          setTimeout(() => {
            const logEntry = logWithContext('DEBUG', 'Async operation');
            results.push({ log: logEntry });
            resolve();
          }, 15);
        })
      ]);
    });
    
    expect(results).to.have.length(2);
    expect(results[0].operation).to.equal('INSERT');
    expect(results[0].requestId).to.equal('req-async');
    expect(results[0].userId).to.equal(404);
    expect(results[1].log).to.equal('[req-async] [DEBUG] Async operation');
  });

  it('should handle nested contexts across files', async () => {
    let outerResult, innerResult;
    
    await stackVars.init(() => {
      stackVars().level = 'outer';
      stackVars().value = 'outer-value';
      
      return stackVars.init('inner', () => {
        setNamedContextValue('inner', 'level', 'inner');
        setNamedContextValue('inner', 'value', 'inner-value');
        
        outerResult = {
          level: getContextValue('level'),
          value: getContextValue('value')
        };
        
        innerResult = {
          level: getNamedContextValue('inner', 'level'),
          value: getNamedContextValue('inner', 'value')
        };
      });
    });
    
    expect(outerResult.level).to.equal('outer');
    expect(outerResult.value).to.equal('outer-value');
    expect(innerResult.level).to.equal('inner');
    expect(innerResult.value).to.equal('inner-value');
  });
});
