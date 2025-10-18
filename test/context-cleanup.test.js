import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Context Cleanup Tests', () => {
    it('should not access context after init block ends', async () => {
        await stackVars.init(() => {
            stackVars().testValue = 'should-be-gone';
            stackVars().userId = 123;
        });

        // Context should be undefined outside of init block
        expect(() => stackVars().testValue).to.throw('Context \'default\' is not available');
        expect(() => stackVars().userId).to.throw('Context \'default\' is not available');
    });

    it('should not access named context after init block ends', async () => {
        await stackVars.init('test', () => {
            stackVars('test').value = 'named-should-be-gone';
            stackVars('test').id = 456;
        });

        // Named context should throw error outside of init block
        expect(() => stackVars('test').value).to.throw('Context \'test\' is not available');
        expect(() => stackVars('test').id).to.throw('Context \'test\' is not available');
    });

    it('should clean up context after nested init blocks', async () => {
        await stackVars.init(() => {
            stackVars().outer = 'outer-value';

            return stackVars.init('inner', () => {
                stackVars('inner').inner = 'inner-value';
                stackVars().outer = 'modified-outer';
            });
        });

        // Both contexts should throw errors after cleanup
        expect(() => stackVars().outer).to.throw('Context \'default\' is not available');
        expect(() => stackVars('inner').inner).to.throw('Context \'inner\' is not available');
    });

    it('should clean up context after async operations complete', async () => {
        await stackVars.init(() => {
            stackVars().asyncValue = 'async-test';

            return new Promise((resolve) => {
                setTimeout(() => {
                    stackVars().delayedValue = 'delayed-test';
                    resolve();
                }, 10);
            });
        });

        // Context should throw errors after async operation
        expect(() => stackVars().asyncValue).to.throw('Context \'default\' is not available');
        expect(() => stackVars().delayedValue).to.throw('Context \'default\' is not available');
    });

    it('should clean up context after Promise.all completes', async () => {
        await stackVars.init(() => {
            stackVars().promiseValue = 'promise-test';

            return Promise.all([
                new Promise(resolve => {
                    setTimeout(() => {
                        stackVars().value1 = 'value1';
                        resolve();
                    }, 5);
                }),
                new Promise(resolve => {
                    setTimeout(() => {
                        stackVars().value2 = 'value2';
                        resolve();
                    }, 10);
                })
            ]);
        });

        // All context values should throw errors after cleanup
        expect(() => stackVars().promiseValue).to.throw('Context \'default\' is not available');
        expect(() => stackVars().value1).to.throw('Context \'default\' is not available');
        expect(() => stackVars().value2).to.throw('Context \'default\' is not available');
    });

    it('should clean up context after error in init block', async () => {
        try {
            await stackVars.init(() => {
                stackVars().errorValue = 'error-test';
                throw new Error('Test error');
            });
        } catch (error) {
            // Error should be caught
            expect(error.message).to.equal('Test error');
        }

        // Context should throw error after cleanup
        expect(() => stackVars().errorValue).to.throw('Context \'default\' is not available');
    });

    it('should clean up context after nested async operations', async () => {
        await stackVars.init(() => {
            stackVars().level1 = 'level1';

            return new Promise((resolve) => {
                setTimeout(() => {
                    stackVars().level2 = 'level2';

                    Promise.resolve().then(() => {
                        stackVars().level3 = 'level3';
                        resolve();
                    });
                }, 5);
            });
        });

        // All nested context values should throw errors after cleanup
        expect(() => stackVars().level1).to.throw('Context \'default\' is not available');
        expect(() => stackVars().level2).to.throw('Context \'default\' is not available');
        expect(() => stackVars().level3).to.throw('Context \'default\' is not available');
    });

    it('should clean up multiple named contexts independently', async () => {
        await stackVars.init('context1', () => {
            stackVars('context1').value1 = 'value1';
        });

        await stackVars.init('context2', () => {
            stackVars('context2').value2 = 'value2';
        });

        // Both named contexts should throw errors after cleanup
        expect(() => stackVars('context1').value1).to.throw('Context \'context1\' is not available');
        expect(() => stackVars('context2').value2).to.throw('Context \'context2\' is not available');
    });

    it('should clean up context after complex nested operations', async () => {
        await stackVars.init(() => {
            stackVars().root = 'root';

            return stackVars.init('nested', () => {
                stackVars('nested').nested = 'nested';

                return new Promise((resolve) => {
                    setTimeout(() => {
                        stackVars().delayed = 'delayed';
                        stackVars('nested').delayedNested = 'delayed-nested';

                        Promise.resolve().then(() => {
                            stackVars().promise = 'promise';
                            resolve();
                        });
                    }, 5);
                });
            });
        });

        // All context values should throw errors after cleanup
        expect(() => stackVars().root).to.throw('Context \'default\' is not available');
        expect(() => stackVars().delayed).to.throw('Context \'default\' is not available');
        expect(() => stackVars().promise).to.throw('Context \'default\' is not available');
        expect(() => stackVars('nested').nested).to.throw('Context \'nested\' is not available');
        expect(() => stackVars('nested').delayedNested).to.throw('Context \'nested\' is not available');
    });

    it('should handle context cleanup with concurrent operations', async () => {
        const promises = [];

        for (let i = 0; i < 3; i++) {
            promises.push(
                stackVars.init(`context${i}`, () => {
                    stackVars(`context${i}`).id = i;
                    stackVars(`context${i}`).timestamp = Date.now();

                    return new Promise((resolve) => {
                        setTimeout(() => {
                            stackVars(`context${i}`).delayed = `delayed-${i}`;
                            resolve();
                        }, 10 + i * 5);
                    });
                })
            );
        }

        await Promise.all(promises);

        // All contexts should throw errors after cleanup
        for (let i = 0; i < 3; i++) {
            expect(() => stackVars(`context${i}`).id).to.throw(`Context 'context${i}' is not available`);
            expect(() => stackVars(`context${i}`).timestamp).to.throw(`Context 'context${i}' is not available`);
            expect(() => stackVars(`context${i}`).delayed).to.throw(`Context 'context${i}' is not available`);
        }
    });

    it('should verify context stores are actually empty', async () => {
        // This test verifies that the internal AsyncLocalStorage stores are cleaned up
        await stackVars.init(() => {
            stackVars().test = 'test';
            stackVars().number = 42;
        });

        // After context ends, accessing the context should throw error
        expect(() => stackVars().test).to.throw('Context \'default\' is not available');
        expect(() => stackVars().number).to.throw('Context \'default\' is not available');
    });

    it('should verify named context stores are actually empty', async () => {
        await stackVars.init('cleanup-test', () => {
            stackVars('cleanup-test').value = 'test';
            stackVars('cleanup-test').number = 99;
        });

        // After context ends, accessing the named context should throw error
        expect(() => stackVars('cleanup-test').value).to.throw('Context \'cleanup-test\' is not available');
        expect(() => stackVars('cleanup-test').number).to.throw('Context \'cleanup-test\' is not available');
    });
});
