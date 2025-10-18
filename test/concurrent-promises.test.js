import { expect } from 'chai';
import stackVars from '../lib/index.js';

describe('Concurrent Promises', () => {
    it('should handle multiple concurrent operations with isolated contexts', async () => {
        const results = [];

        const createOperation = (id, delay) => {
            return stackVars.init(() => {
                stackVars().operationId = id;
                stackVars().startTime = Date.now();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        results.push({
                            id: stackVars().operationId,
                            duration: Date.now() - stackVars().startTime
                        });
                        resolve();
                    }, delay);
                });
            });
        };

        await Promise.all([
            createOperation('op1', 50),
            createOperation('op2', 30),
            createOperation('op3', 70)
        ]);

        expect(results).to.have.length(3);
        expect(results.map(r => r.id)).to.include.members(['op1', 'op2', 'op3']);
        results.forEach(result => {
            expect(result.duration).to.be.a('number');
            expect(result.duration).to.be.at.least(25); // Allow some tolerance
        });
    });

    it('should handle nested concurrent operations', async () => {
        let results = [];

        await stackVars.init(() => {
            stackVars().parentId = 'parent';
            stackVars().counter = 0;

            const nestedOperation = (childId) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        stackVars().counter++;
                        results.push({
                            parentId: stackVars().parentId,
                            childId: childId,
                            counter: stackVars().counter
                        });
                        resolve();
                    }, 20);
                });
            };

            return Promise.all([
                nestedOperation('child1'),
                nestedOperation('child2'),
                nestedOperation('child3')
            ]);
        });

        expect(results).to.have.length(3);
        results.forEach(result => {
            expect(result.parentId).to.equal('parent');
        });
        expect(results.map(r => r.counter)).to.deep.equal([1, 2, 3]);
    });

    it('should handle context switching between concurrent operations', async () => {
        let results = [];

        const operation1 = stackVars.init(() => {
            stackVars().context = 'context1';
            stackVars().value = 'value1';

            return new Promise((resolve) => {
                setTimeout(() => {
                    results.push({
                        context: stackVars().context,
                        value: stackVars().value
                    });
                    resolve();
                }, 30);
            });
        });

        const operation2 = stackVars.init(() => {
            stackVars().context = 'context2';
            stackVars().value = 'value2';

            return new Promise((resolve) => {
                setTimeout(() => {
                    results.push({
                        context: stackVars().context,
                        value: stackVars().value
                    });
                    resolve();
                }, 20);
            });
        });

        await Promise.all([operation1, operation2]);

        expect(results).to.have.length(2);
        const context1Result = results.find(r => r.context === 'context1');
        const context2Result = results.find(r => r.context === 'context2');

        expect(context1Result.value).to.equal('value1');
        expect(context2Result.value).to.equal('value2');
    });

    it('should handle mixed async operations', async () => {
        let results = [];

        await stackVars.init(() => {
            stackVars().batchId = 'batch-123';
            stackVars().completed = 0;

            const operations = [
                // setTimeout
                new Promise((resolve) => {
                    setTimeout(() => {
                        stackVars().completed++;
                        results.push({
                            type: 'setTimeout',
                            batchId: stackVars().batchId,
                            completed: stackVars().completed
                        });
                        resolve();
                    }, 25);
                }),

                // Promise.resolve
                Promise.resolve().then(() => {
                    stackVars().completed++;
                    results.push({
                        type: 'Promise.resolve',
                        batchId: stackVars().batchId,
                        completed: stackVars().completed
                    });
                }),

                // setImmediate
                new Promise((resolve) => {
                    setImmediate(() => {
                        stackVars().completed++;
                        results.push({
                            type: 'setImmediate',
                            batchId: stackVars().batchId,
                            completed: stackVars().completed
                        });
                        resolve();
                    });
                })
            ];

            return Promise.all(operations);
        });

        expect(results).to.have.length(3);
        results.forEach(result => {
            expect(result.batchId).to.equal('batch-123');
        });
        expect(results.map(r => r.completed)).to.include.members([1, 2, 3]);
    });
});