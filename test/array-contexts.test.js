import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Array Context Tests', () => {
  it('should create multiple contexts with array parameter', async () => {
    let result = {};
    
    await stackVars.init(['auth', 'user', 'session'], () => {
      stackVars('auth').token = 'abc123';
      stackVars('auth').expires = Date.now() + 3600000;
      
      stackVars('user').id = 456;
      stackVars('user').name = 'Alice';
      
      stackVars('session').sessionId = 'sess-789';
      stackVars('session').created = Date.now();
      
      result = {
        auth: {
          token: stackVars('auth').token,
          expires: stackVars('auth').expires
        },
        user: {
          id: stackVars('user').id,
          name: stackVars('user').name
        },
        session: {
          sessionId: stackVars('session').sessionId,
          created: stackVars('session').created
        }
      };
    });
    
    expect(result.auth.token).to.equal('abc123');
    expect(result.auth.expires).to.be.a('number');
    expect(result.user.id).to.equal(456);
    expect(result.user.name).to.equal('Alice');
    expect(result.session.sessionId).to.equal('sess-789');
    expect(result.session.created).to.be.a('number');
  });

  it('should create multiple contexts with object parameter containing name array', async () => {
    let result = {};
    
    await stackVars.init({name: ['auth', 'user']}, () => {
      stackVars('auth').token = 'def456';
      stackVars('auth').permissions = ['read', 'write'];
      
      stackVars('user').id = 789;
      stackVars('user').role = 'admin';
      
      result = {
        auth: {
          token: stackVars('auth').token,
          permissions: stackVars('auth').permissions
        },
        user: {
          id: stackVars('user').id,
          role: stackVars('user').role
        }
      };
    });
    
    expect(result.auth.token).to.equal('def456');
    expect(result.auth.permissions).to.deep.equal(['read', 'write']);
    expect(result.user.id).to.equal(789);
    expect(result.user.role).to.equal('admin');
  });

  it('should handle single context in array', async () => {
    let result;
    
    await stackVars.init(['user'], () => {
      stackVars('user').id = 123;
      stackVars('user').name = 'Bob';
      
      result = {
        id: stackVars('user').id,
        name: stackVars('user').name
      };
    });
    
    expect(result.id).to.equal(123);
    expect(result.name).to.equal('Bob');
  });

  it('should handle default context in array', async () => {
    let result;
    
    await stackVars.init(['default'], () => {
      stackVars().value = 'default-value';
      stackVars().number = 42;
      
      result = {
        value: stackVars().value,
        number: stackVars().number
      };
    });
    
    expect(result.value).to.equal('default-value');
    expect(result.number).to.equal(42);
  });

  it('should handle mixed default and named contexts', async () => {
    let result = {};
    
    await stackVars.init(['default', 'user', 'auth'], () => {
      stackVars().requestId = 'req-123';
      stackVars().timestamp = Date.now();
      
      stackVars('user').id = 456;
      stackVars('user').name = 'Charlie';
      
      stackVars('auth').token = 'ghi789';
      stackVars('auth').isAuthenticated = true;
      
      result = {
        default: {
          requestId: stackVars().requestId,
          timestamp: stackVars().timestamp
        },
        user: {
          id: stackVars('user').id,
          name: stackVars('user').name
        },
        auth: {
          token: stackVars('auth').token,
          isAuthenticated: stackVars('auth').isAuthenticated
        }
      };
    });
    
    expect(result.default.requestId).to.equal('req-123');
    expect(result.default.timestamp).to.be.a('number');
    expect(result.user.id).to.equal(456);
    expect(result.user.name).to.equal('Charlie');
    expect(result.auth.token).to.equal('ghi789');
    expect(result.auth.isAuthenticated).to.be.true;
  });

  it('should handle async operations with multiple contexts', async () => {
    let results = [];
    
    await stackVars.init(['auth', 'user'], () => {
      stackVars('auth').token = 'async-token';
      stackVars('user').id = 999;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          stackVars('auth').expires = Date.now();
          stackVars('user').lastLogin = Date.now();
          
          results.push({
            auth: {
              token: stackVars('auth').token,
              expires: stackVars('auth').expires
            },
            user: {
              id: stackVars('user').id,
              lastLogin: stackVars('user').lastLogin
            }
          });
          
          resolve();
        }, 10);
      });
    });
    
    expect(results).to.have.length(1);
    expect(results[0].auth.token).to.equal('async-token');
    expect(results[0].auth.expires).to.be.a('number');
    expect(results[0].user.id).to.equal(999);
    expect(results[0].user.lastLogin).to.be.a('number');
  });

  it('should handle nested array contexts', async () => {
    let result = {};
    
    await stackVars.init(['auth'], () => {
      stackVars('auth').token = 'parent-token';
      
      return stackVars.init(['user', 'session'], () => {
        stackVars('user').id = 111;
        stackVars('session').id = 'sess-222';
        
        result = {
          auth: {
            token: stackVars('auth').token
          },
          user: {
            id: stackVars('user').id
          },
          session: {
            id: stackVars('session').id
          }
        };
      });
    });
    
    expect(result.auth.token).to.equal('parent-token');
    expect(result.user.id).to.equal(111);
    expect(result.session.id).to.equal('sess-222');
  });

  it('should throw error for empty array', async () => {
    try {
      await stackVars.init([], () => {
        // This should not execute
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('Context names must be a non-empty array');
    }
  });

  it('should throw error for non-string context names', async () => {
    try {
      await stackVars.init(['valid', 123, 'also-valid'], () => {
        // This should not execute
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('Context names must be strings');
    }
  });

  it('should handle non-array in object name property as single context', async () => {
    let result;
    
    await stackVars.init({name: 'single-context'}, () => {
      stackVars('single-context').value = 'test-value';
      result = stackVars('single-context').value;
    });
    
    expect(result).to.equal('test-value');
  });

  it('should handle complex nested operations with multiple contexts', async () => {
    let results = [];
    
    await stackVars.init(['auth', 'user', 'session'], () => {
      stackVars('auth').token = 'complex-token';
      stackVars('user').id = 333;
      stackVars('session').id = 'sess-444';
      
      return Promise.all([
        new Promise((resolve) => {
          setTimeout(() => {
            stackVars('auth').expires = Date.now();
            results.push('auth-updated');
            resolve();
          }, 5);
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            stackVars('user').lastActivity = Date.now();
            results.push('user-updated');
            resolve();
          }, 10);
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            stackVars('session').timeout = Date.now() + 1800000;
            results.push('session-updated');
            resolve();
          }, 15);
        })
      ]).then(() => {
        results.push({
          auth: {
            token: stackVars('auth').token,
            expires: stackVars('auth').expires
          },
          user: {
            id: stackVars('user').id,
            lastActivity: stackVars('user').lastActivity
          },
          session: {
            id: stackVars('session').id,
            timeout: stackVars('session').timeout
          }
        });
      });
    });
    
    expect(results).to.have.length(4);
    expect(results).to.include('auth-updated');
    expect(results).to.include('user-updated');
    expect(results).to.include('session-updated');
    expect(results[3].auth.token).to.equal('complex-token');
    expect(results[3].auth.expires).to.be.a('number');
    expect(results[3].user.id).to.equal(333);
    expect(results[3].user.lastActivity).to.be.a('number');
    expect(results[3].session.id).to.equal('sess-444');
    expect(results[3].session.timeout).to.be.a('number');
  });

  it('should clean up all contexts after init block ends', async () => {
    await stackVars.init(['auth', 'user', 'session'], () => {
      stackVars('auth').token = 'cleanup-test';
      stackVars('user').id = 555;
      stackVars('session').id = 'sess-666';
    });
    
    // All contexts should throw errors after cleanup
    expect(() => stackVars('auth').token).to.throw('Context \'auth\' is not available');
    expect(() => stackVars('user').id).to.throw('Context \'user\' is not available');
    expect(() => stackVars('session').id).to.throw('Context \'session\' is not available');
  });
});
