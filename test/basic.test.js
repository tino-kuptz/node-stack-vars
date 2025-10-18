import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Basic Functionality', () => {
    it('should throw error when accessing context outside of init', () => {
        expect(() => {
            stackVars().userId;
        }).to.throw('Context \'default\' is not available. Make sure to call stackVars.init() first.');
    });

    it('should set and get variables in default context', async () => {
        let result;

        await stackVars.init(() => {
            stackVars().userId = 15;
            result = stackVars().userId;
        });

        expect(result).to.equal(15);
    });

    it('should handle string parameter for context name', async () => {
        let result;

        await stackVars.init('user', () => {
            stackVars('user').id = 42;
            result = stackVars('user').id;
        });

        expect(result).to.equal(42);
    });

    it('should handle object parameter with name property', async () => {
        let result;

        await stackVars.init({ name: 'session' }, () => {
            stackVars('session').token = 'abc123';
            result = stackVars('session').token;
        });

        expect(result).to.equal('abc123');
    });

    it('should return promise from init', async () => {
        const result = await stackVars.init(() => {
            stackVars().value = 'test';
            return 'success';
        });

        expect(result).to.equal('success');
    });

    it('should handle async callback in init', async () => {
        let result;

        await stackVars.init(async () => {
            stackVars().value = 'async';
            await new Promise(resolve => setTimeout(resolve, 10));
            result = stackVars().value;
        });

        expect(result).to.equal('async');
    });

    it('should throw error for invalid parameters', () => {
        expect(() => {
            stackVars.init();
        }).to.throw('Callback function is required');

        expect(() => {
            stackVars.init('context');
        }).to.throw('Callback function is required');
    });
});