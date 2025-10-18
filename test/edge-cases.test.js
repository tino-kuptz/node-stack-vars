import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Edge Cases', () => {
  it('should handle empty context', async () => {
    let result;

    await stackVars.init(() => {
      result = Object.keys(stackVars());
    });

    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });

  it('should handle undefined and null values', async () => {
    let result;

    await stackVars.init(() => {
      stackVars().undefinedValue = undefined;
      stackVars().nullValue = null;
      stackVars().zeroValue = 0;
      stackVars().emptyString = '';

      result = {
        undefinedValue: stackVars().undefinedValue,
        nullValue: stackVars().nullValue,
        zeroValue: stackVars().zeroValue,
        emptyString: stackVars().emptyString
      };
    });

    expect(result.undefinedValue).to.be.undefined;
    expect(result.nullValue).to.be.null;
    expect(result.zeroValue).to.equal(0);
    expect(result.emptyString).to.equal('');
  });

  it('should handle complex objects', async () => {
    let result;

    await stackVars.init(() => {
      const complexObject = {
        user: { id: 1, name: 'John' },
        permissions: ['read', 'write'],
        metadata: { created: Date.now() }
      };

      stackVars().complex = complexObject;
      result = stackVars().complex;
    });

    expect(result).to.deep.equal({
      user: { id: 1, name: 'John' },
      permissions: ['read', 'write'],
      metadata: { created: result.metadata.created }
    });
  });

  it('should handle function values', async () => {
    let result;

    await stackVars.init(() => {
      const testFunction = () => 'test';
      stackVars().fn = testFunction;
      result = stackVars().fn();
    });

    expect(result).to.equal('test');
  });

  it('should handle error in callback', async () => {
    let error;

    try {
      await stackVars.init(() => {
        stackVars().value = 'test';
        throw new Error('Test error');
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
    expect(error.message).to.equal('Test error');
  });

  it('should handle multiple contexts with same name', async () => {
    let results = [];

    await stackVars.init(() => {
      return stackVars.init('test', () => {
        stackVars('test').value = 'first';
        results.push(stackVars('test').value);
      }).then(() => {
        return stackVars.init('test', () => {
          stackVars('test').value = 'second';
          results.push(stackVars('test').value);
        });
      });
    });

    expect(results).to.deep.equal(['first', 'second']);
  });

  it('should handle context access in hasOwnProperty check', async () => {
    let result;

    await stackVars.init(() => {
      stackVars().test = 'value';
      result = stackVars().hasOwnProperty('test');
    });

    expect(result).to.be.true;
  });

  it('should handle Object.keys() on context', async () => {
    let result;

    await stackVars.init(() => {
      stackVars().a = 1;
      stackVars().b = 2;
      stackVars().c = 3;
      result = Object.keys(stackVars());
    });

    expect(result).to.include.members(['a', 'b', 'c']);
    expect(result).to.have.length(3);
  });
});