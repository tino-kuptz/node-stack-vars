import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Async Context Inheritance', () => {
    it('should preserve context across setTimeout', async () => {
        let result;

        await stackVars.init(() => {
            stackVars().userId = 42;

            return new Promise((resolve) => {
                setTimeout(() => {
                    result = stackVars().userId;
                    resolve();
                }, 10);
            });
        });

        expect(result).to.equal(42);
    });

    it('should preserve context across Promise', async () => {
        let result;

        await stackVars.init(() => {
            stackVars().requestId = 'req-123';

            return new Promise((resolve) => {
                Promise.resolve().then(() => {
                    result = stackVars().requestId;
                    resolve();
                });
            });
        });

        expect(result).to.equal('req-123');
    });

    it('should preserve context across async/await', async () => {
        let result;

        await stackVars.init(async () => {
            stackVars().sessionId = 'session-456';

            await new Promise(resolve => setTimeout(resolve, 10));

            result = stackVars().sessionId;
        });

        expect(result).to.equal('session-456');
    });

    it('should preserve context across nested async operations', async () => {
        let result;

        await stackVars.init(() => {
            stackVars().traceId = 'trace-789';

            return new Promise((resolve) => {
                setTimeout(() => {
                    Promise.resolve().then(() => {
                        setTimeout(() => {
                            result = stackVars().traceId;
                            resolve();
                        }, 10);
                    });
                }, 10);
            });
        });

        expect(result).to.equal('trace-789');
    });

    it('should preserve context across function calls', async () => {
        let result;

        const testFunction = () => {
            return stackVars().userId;
        };

        await stackVars.init(() => {
            stackVars().userId = 99;

            return new Promise((resolve) => {
                setTimeout(() => {
                    result = testFunction();
                    resolve();
                }, 10);
            });
        });

        expect(result).to.equal(99);
    });

    it('should preserve context across multiple async boundaries', async () => {
        let results = [];

        await stackVars.init(() => {
            stackVars().counter = 0;

            const asyncOperation = () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        stackVars().counter++;
                        results.push(stackVars().counter);
                        resolve();
                    }, 10);
                });
            };

            return Promise.all([
                asyncOperation(),
                asyncOperation(),
                asyncOperation()
            ]);
        });

        expect(results).to.have.length(3);
        expect(results).to.deep.equal([1, 2, 3]);
    });
});