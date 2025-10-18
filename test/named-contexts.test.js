import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Named Contexts', () => {
    it('should create multiple named contexts independently', async () => {
        let userResult, sessionResult;

        await stackVars.init(() => {
            stackVars().global = 'global-value';

            return stackVars.init('user', () => {
                stackVars('user').id = 123;
                stackVars('user').name = 'John';
                userResult = {
                    id: stackVars('user').id,
                    name: stackVars('user').name,
                    global: stackVars().global
                };
            }).then(() => {
                return stackVars.init('session', () => {
                    stackVars('session').token = 'token123';
                    stackVars('session').expires = Date.now();
                    sessionResult = {
                        token: stackVars('session').token,
                        expires: stackVars('session').expires,
                        global: stackVars().global
                    };
                });
            });
        });

        expect(userResult.id).to.equal(123);
        expect(userResult.name).to.equal('John');
        expect(userResult.global).to.equal('global-value');

        expect(sessionResult.token).to.equal('token123');
        expect(sessionResult.expires).to.be.a('number');
        expect(sessionResult.global).to.equal('global-value');
    });

    it('should isolate contexts from each other', async () => {
        let userResult, sessionResult;

        await stackVars.init(() => {
            return stackVars.init('user', () => {
                stackVars('user').secret = 'user-secret';
                userResult = {
                    hasUserSecret: 'secret' in stackVars('user'),
                    hasSessionSecret: 'secret' in stackVars('session')
                };
            }).then(() => {
                return stackVars.init('session', () => {
                    stackVars('session').secret = 'session-secret';
                    sessionResult = {
                        hasUserSecret: 'secret' in stackVars('user'),
                        hasSessionSecret: 'secret' in stackVars('session')
                    };
                });
            });
        });

        expect(userResult.hasUserSecret).to.be.true;
        expect(userResult.hasSessionSecret).to.be.false;

        expect(sessionResult.hasUserSecret).to.be.false;
        expect(sessionResult.hasSessionSecret).to.be.true;
    });

    it('should handle nested named contexts', async () => {
        let result;

        await stackVars.init('outer', () => {
            stackVars('outer').value = 'outer-value';

            return stackVars.init('inner', () => {
                stackVars('inner').value = 'inner-value';
                result = {
                    outer: stackVars('outer').value,
                    inner: stackVars('inner').value
                };
            });
        });

        expect(result.outer).to.equal('outer-value');
        expect(result.inner).to.equal('inner-value');
    });

    it('should throw error when accessing named context outside of init', () => {
        expect(() => {
            stackVars('user').id;
        }).to.throw('Context \'user\' is not available. Make sure to call stackVars.init() first.');
    });
});