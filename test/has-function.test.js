import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Has Function Tests', () => {
  it('should return false when no context exists', () => {
    expect(stackVars.has('default')).to.be.false;
    expect(stackVars.has('user')).to.be.false;
    expect(stackVars.has('auth')).to.be.false;
  });

  it('should return true for default context when it exists', async () => {
    await stackVars.init(() => {
      expect(stackVars.has('default')).to.be.true;
    });
  });

  it('should return false for non-existent contexts when default exists', async () => {
    await stackVars.init(() => {
      expect(stackVars.has('default')).to.be.true;
      expect(stackVars.has('user')).to.be.false;
      expect(stackVars.has('auth')).to.be.false;
    });
  });

  it('should return true for named context when it exists', async () => {
    await stackVars.init('user', () => {
      expect(stackVars.has('user')).to.be.true;
    });
  });

  it('should return false for non-existent contexts when named context exists', async () => {
    await stackVars.init('user', () => {
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('default')).to.be.false;
      expect(stackVars.has('auth')).to.be.false;
    });
  });

  it('should return true for multiple contexts when they exist', async () => {
    await stackVars.init(['auth', 'user', 'session'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('session')).to.be.true;
    });
  });

  it('should return false for non-existent contexts when multiple contexts exist', async () => {
    await stackVars.init(['auth', 'user'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('session')).to.be.false;
      expect(stackVars.has('default')).to.be.false;
    });
  });

  it('should return false for mixed default and named contexts when only some exist', async () => {
    await stackVars.init(['default', 'user'], () => {
      expect(stackVars.has('default')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('auth')).to.be.false;
      expect(stackVars.has('session')).to.be.false;
    });
  });

  it('should return false after context ends', async () => {
    await stackVars.init(() => {
      expect(stackVars.has('default')).to.be.true;
    });
    
    expect(stackVars.has('default')).to.be.false;
  });

  it('should return false after named context ends', async () => {
    await stackVars.init('user', () => {
      expect(stackVars.has('user')).to.be.true;
    });
    
    expect(stackVars.has('user')).to.be.false;
  });

  it('should return false after multiple contexts end', async () => {
    await stackVars.init(['auth', 'user', 'session'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('session')).to.be.true;
    });
    
    expect(stackVars.has('auth')).to.be.false;
    expect(stackVars.has('user')).to.be.false;
    expect(stackVars.has('session')).to.be.false;
  });

  it('should work with async operations', async () => {
    await stackVars.init(['auth', 'user'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(stackVars.has('auth')).to.be.true;
          expect(stackVars.has('user')).to.be.true;
          expect(stackVars.has('session')).to.be.false;
          resolve();
        }, 10);
      });
    });
  });

  it('should work with nested contexts', async () => {
    await stackVars.init('auth', () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.false;
      
      return stackVars.init('user', () => {
        expect(stackVars.has('auth')).to.be.true;
        expect(stackVars.has('user')).to.be.true;
        expect(stackVars.has('session')).to.be.false;
      });
    });
  });

  it('should work with nested array contexts', async () => {
    await stackVars.init(['auth'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.false;
      
      return stackVars.init(['user', 'session'], () => {
        expect(stackVars.has('auth')).to.be.true;
        expect(stackVars.has('user')).to.be.true;
        expect(stackVars.has('session')).to.be.true;
      });
    });
  });

  it('should throw error for invalid context names', () => {
    expect(() => stackVars.has(null)).to.throw('Context name must be a string');
    expect(() => stackVars.has(undefined)).to.throw('Context name must be a string');
    expect(() => stackVars.has(123)).to.throw('Context name must be a string');
    expect(() => stackVars.has({})).to.throw('Context name must be a string');
    expect(() => stackVars.has([])).to.throw('Context name must be a string');
  });

  it('should throw error for invalid context names even when context exists', async () => {
    await stackVars.init('user', () => {
      expect(stackVars.has('user')).to.be.true;
      expect(() => stackVars.has(null)).to.throw('Context name must be a string');
      expect(() => stackVars.has(undefined)).to.throw('Context name must be a string');
      expect(() => stackVars.has(123)).to.throw('Context name must be a string');
      expect(() => stackVars.has({})).to.throw('Context name must be a string');
      expect(() => stackVars.has([])).to.throw('Context name must be a string');
    });
  });

  it('should work with complex nested operations', async () => {
    await stackVars.init(['auth', 'user'], () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      
      return Promise.all([
        new Promise((resolve) => {
          setTimeout(() => {
            expect(stackVars.has('auth')).to.be.true;
            expect(stackVars.has('user')).to.be.true;
            expect(stackVars.has('session')).to.be.false;
            resolve();
          }, 5);
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            expect(stackVars.has('auth')).to.be.true;
            expect(stackVars.has('user')).to.be.true;
            expect(stackVars.has('default')).to.be.false;
            resolve();
          }, 10);
        })
      ]);
    });
  });

  it('should work with object syntax for multiple contexts', async () => {
    await stackVars.init({name: ['auth', 'user']}, () => {
      expect(stackVars.has('auth')).to.be.true;
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('session')).to.be.false;
      expect(stackVars.has('default')).to.be.false;
    });
  });

  it('should work with single context in array', async () => {
    await stackVars.init(['user'], () => {
      expect(stackVars.has('user')).to.be.true;
      expect(stackVars.has('auth')).to.be.false;
      expect(stackVars.has('default')).to.be.false;
    });
  });

  it('should work with default context in array', async () => {
    await stackVars.init(['default'], () => {
      expect(stackVars.has('default')).to.be.true;
      expect(stackVars.has('user')).to.be.false;
      expect(stackVars.has('auth')).to.be.false;
    });
  });
});
