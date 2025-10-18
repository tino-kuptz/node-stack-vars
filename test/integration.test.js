import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Integration Tests', () => {
    it('should simulate request tracing scenario', async () => {
        let results = [];

        // Simulate middleware
        await stackVars.init(() => {
            stackVars().requestId = 'req-123';
            stackVars().userId = 42;
            stackVars().startTime = Date.now();

            // Simulate route handler
            return new Promise((resolve) => {
                setTimeout(() => {
                    const requestId = stackVars().requestId;
                    const userId = stackVars().userId;

                    // Simulate service call
                    Promise.resolve().then(() => {
                        results.push({
                            requestId: stackVars().requestId,
                            userId: stackVars().userId,
                            processingTime: Date.now() - stackVars().startTime
                        });
                        resolve();
                    });
                }, 10);
            });
        });

        expect(results).to.have.length(1);
        expect(results[0].requestId).to.equal('req-123');
        expect(results[0].userId).to.equal(42);
        expect(results[0].processingTime).to.be.a('number');
    });

    it('should simulate logging scenario', async () => {
        let logs = [];

        await stackVars.init(() => {
            stackVars().requestId = 'req-456';
            stackVars().userId = 99;

            const log = (message) => {
                logs.push(`[${stackVars().requestId}] ${message}`);
            };

            return new Promise((resolve) => {
                setTimeout(() => {
                    log('Processing request');

                    Promise.resolve().then(() => {
                        log('Request completed');
                        resolve();
                    });
                }, 10);
            });
        });

        expect(logs).to.have.length(2);
        expect(logs[0]).to.equal('[req-456] Processing request');
        expect(logs[1]).to.equal('[req-456] Request completed');
    });

    it('should simulate database transaction scenario', async () => {
        let results = [];

        await stackVars.init(() => {
            stackVars().transactionId = 'tx-789';
            stackVars().userId = 123;

            const dbOperation = async (operation) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return {
                    transactionId: stackVars().transactionId,
                    userId: stackVars().userId,
                    operation
                };
            };

            return Promise.all([
                dbOperation('SELECT'),
                dbOperation('INSERT'),
                dbOperation('UPDATE')
            ]).then(dbResults => {
                results = dbResults;
            });
        });

        expect(results).to.have.length(3);
        results.forEach(result => {
            expect(result.transactionId).to.equal('tx-789');
            expect(result.userId).to.equal(123);
        });
        expect(results.map(r => r.operation)).to.deep.equal(['SELECT', 'INSERT', 'UPDATE']);
    });

    it('should simulate multi-context application', async () => {
        let results = {};

        await stackVars.init(() => {
            stackVars().app = 'my-app';

            // User context
            return stackVars.init('user', () => {
                stackVars('user').id = 456;
                stackVars('user').name = 'Alice';
                results.user = {
                    id: stackVars('user').id,
                    name: stackVars('user').name,
                    app: stackVars().app
                };
            }).then(() => {
                // Session context
                return stackVars.init('session', () => {
                    stackVars('session').token = 'token-abc';
                    stackVars('session').expires = Date.now() + 3600000;
                    results.session = {
                        token: stackVars('session').token,
                        expires: stackVars('session').expires,
                        app: stackVars().app
                    };
                });
            }).then(() => {
                // Audit context
                return stackVars.init('audit', () => {
                    stackVars('audit').events = [];
                    stackVars('audit').addEvent = (event) => {
                        stackVars('audit').events.push({
                            ...event,
                            timestamp: Date.now(),
                            app: stackVars().app
                        });
                    };

                    stackVars('audit').addEvent({ type: 'LOGIN', userId: 456 });
                    results.audit = {
                        events: stackVars('audit').events,
                        app: stackVars().app
                    };
                });
            });
        });

        expect(results.user.id).to.equal(456);
        expect(results.user.name).to.equal('Alice');
        expect(results.user.app).to.equal('my-app');

        expect(results.session.token).to.equal('token-abc');
        expect(results.session.expires).to.be.a('number');
        expect(results.session.app).to.equal('my-app');

        expect(results.audit.events).to.have.length(1);
        expect(results.audit.events[0].type).to.equal('LOGIN');
        expect(results.audit.events[0].userId).to.equal(456);
        expect(results.audit.app).to.equal('my-app');
    });
});