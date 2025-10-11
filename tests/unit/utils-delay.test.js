import assert from "node:assert";
import { delay } from "../../src/utils/delay.js";

describe("delay", () => {
	it("should execute function immediately when n=0", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, 0);

		// Should execute immediately
		assert.strictEqual(executed, true);
		done();
	});

	it("should execute function immediately when n is not provided", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn);

		// Should execute immediately
		assert.strictEqual(executed, true);
		done();
	});

	it("should execute function after delay when n > 0", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, 10);

		// Should not execute immediately
		assert.strictEqual(executed, false);

		// Check after delay
		setTimeout(() => {
			assert.strictEqual(executed, true);
			done();
		}, 15);
	});

	it("should execute function with return value", done => {
		let result = null;
		const fn = () => {
			result = "executed";

			return "test";
		};

		delay(fn, 0);

		assert.strictEqual(result, "executed");
		done();
	});

	it("should handle function with parameters", done => {
		let result = null;
		const fn = value => {
			result = value;
		};

		// Create a wrapper function to pass parameters
		const wrappedFn = () => fn("test-param");

		delay(wrappedFn, 0);

		assert.strictEqual(result, "test-param");
		done();
	});

	it("should handle errors in function", done => {
		const fn = () => {
			throw new Error("Test error");
		};

		// Should not throw when function is called
		assert.doesNotThrow(() => {
			delay(fn, 0);
		});
		done();
	});

	it("should use default function when no function provided", done => {
		// Should not throw when called without function
		assert.doesNotThrow(() => {
			delay();
		});

		assert.doesNotThrow(() => {
			delay(undefined, 0);
		});
		done();
	});

	it("should handle null function", done => {
		// Should not throw when called with null
		assert.doesNotThrow(() => {
			delay(null, 0);
		});
		done();
	});

	it("should delay execution based on random value", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, 50);

		// Should not execute immediately
		assert.strictEqual(executed, false);

		// Check that it executes after some reasonable delay
		// Focus on behavior rather than precise timing since timing can be inconsistent
		setTimeout(() => {
			assert.strictEqual(executed, true, "Function should have executed after delay");
			done();
		}, 150); // More generous timeout to avoid flaky test failures
	});

	// NEW TEST CASES FOR IMPROVED COVERAGE

	it("should handle negative values for n parameter", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, -10);

		// Should not execute immediately since n is not 0
		assert.strictEqual(executed, false);

		// Check after small delay (random function returns 1 for negative inputs)
		setTimeout(() => {
			assert.strictEqual(executed, true);
			done();
		}, 10);
	});

	it("should throw error for decimal values for n parameter", done => {
		const fn = () => {};

		// Should throw error when non-integer passed to random function
		assert.throws(() => {
			delay(fn, 5.7);
		}, TypeError);
		done();
	});

	it("should throw error for NaN for n parameter", done => {
		const fn = () => {};

		// Should throw error when NaN passed to random function
		assert.throws(() => {
			delay(fn, NaN);
		}, TypeError);
		done();
	});

	it("should throw error for string values for n parameter", done => {
		const fn = () => {};

		// Should throw error when string passed to random function
		assert.throws(() => {
			delay(fn, "10");
		}, TypeError);
		done();
	});

	it("should throw error for non-numeric strings for n parameter", done => {
		const fn = () => {};

		// Should throw error when non-numeric string passed to random function
		assert.throws(() => {
			delay(fn, "invalid");
		}, TypeError);
		done();
	});

	it("should throw error for object for n parameter", done => {
		const fn = () => {};

		// Should throw error when object passed to random function
		assert.throws(() => {
			delay(fn, {});
		}, TypeError);
		done();
	});

	it("should throw error for array for n parameter", done => {
		const fn = () => {};

		// Should throw error when array passed to random function
		assert.throws(() => {
			delay(fn, [5]);
		}, TypeError);
		done();
	});

	it("should handle integer edge cases for n parameter", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		// Test with integer 1 (smallest valid positive value)
		delay(fn, 1);

		// Should not execute immediately
		assert.strictEqual(executed, false);

		// Check after small delay
		setTimeout(() => {
			assert.strictEqual(executed, true);
			done();
		}, 10);
	});

	it("should handle undefined for n parameter (should default to INT_0)", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, undefined);

		// Should execute immediately when n is undefined (defaults to INT_0)
		assert.strictEqual(executed, true);
		done();
	});

	it("should handle null for n parameter", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		delay(fn, null);

		// Should execute immediately when n is null (null == 0 is false, but null === 0 is false too)
		// null is not INT_0, so it should delay
		assert.strictEqual(executed, false);

		setTimeout(() => {
			assert.strictEqual(executed, true);
			done();
		}, 10);
	});

	it("should handle string as function parameter", done => {
		// Should not throw when called with string
		assert.doesNotThrow(() => {
			delay("not a function", 0);
		});
		done();
	});

	it("should handle number as function parameter", done => {
		// Should not throw when called with number
		assert.doesNotThrow(() => {
			delay(123, 0);
		});
		done();
	});

	it("should handle object as function parameter", done => {
		// Should not throw when called with object
		assert.doesNotThrow(() => {
			delay({}, 0);
		});
		done();
	});

	it("should handle array as function parameter", done => {
		// Should not throw when called with array
		assert.doesNotThrow(() => {
			delay([], 0);
		});
		done();
	});

	it("should handle errors in delayed function execution", done => {
		const fn = () => {
			throw new Error("Delayed error");
		};

		// Should not throw when function with error is delayed
		assert.doesNotThrow(() => {
			delay(fn, 5);
		});

		// Wait for delayed execution to complete
		setTimeout(() => {
			// If we reach here, the error was properly swallowed
			done();
		}, 20);
	});

	it("should handle different types of errors in function", done => {
		const fnWithTypeError = () => {
			throw new TypeError("Type error");
		};

		const fnWithRangeError = () => {
			throw new RangeError("Range error");
		};

		const fnWithString = () => {
			throw new Error("String error");
		};

		// Should not throw for any type of error
		assert.doesNotThrow(() => {
			delay(fnWithTypeError, 0);
		});

		assert.doesNotThrow(() => {
			delay(fnWithRangeError, 0);
		});

		assert.doesNotThrow(() => {
			delay(fnWithString, 0);
		});

		done();
	});

	it("should handle async functions (though not awaited)", done => {
		let executed = false;
		const asyncFn = async () => {
			executed = true;

			return "async result";
		};

		delay(asyncFn, 0);

		// Should execute immediately (though not awaited)
		assert.strictEqual(executed, true);

		done();
	});

	it("should execute multiple delay calls independently", done => {
		let count = 0;
		const fn = () => {
			count++;
		};

		// Multiple immediate executions
		delay(fn, 0);
		delay(fn, 0);
		delay(fn, 0);

		assert.strictEqual(count, 3);

		// Multiple delayed executions
		delay(fn, 5);
		delay(fn, 5);

		setTimeout(() => {
			assert.strictEqual(count, 5);
			done();
		}, 20);
	});

	it("should handle moderately large delay values", done => {
		let executed = false;
		const fn = () => {
			executed = true;
		};

		// Use a moderately large number (100ms max due to random function)
		delay(fn, 100);

		// Should not execute immediately
		assert.strictEqual(executed, false);

		// Check that it's scheduled and wait for completion
		setTimeout(() => {
			assert.strictEqual(executed, true);
			done();
		}, 150);
	});

	it("should verify delay is within expected range", done => {
		const startTime = Date.now();
		const fn = () => {
			const endTime = Date.now();
			const actualDelay = endTime - startTime;

			// Delay should be between 1 and 20 milliseconds (based on random function behavior)
			// Allow some extra margin for test environment variability
			assert.ok(actualDelay >= 0 && actualDelay <= 50, `Delay was ${actualDelay}ms, expected between 0-50ms`);
			done();
		};

		delay(fn, 20);
	});

	it("should handle functions that modify global state", done => {
		const originalConsoleLog = console.log;
		let logCalled = false;

		// Mock console.log
		console.log = () => {
			logCalled = true;
		};

		const fn = () => {
			console.log("test");
		};

		delay(fn, 0);

		// Restore console.log
		console.log = originalConsoleLog;

		assert.strictEqual(logCalled, true);
		done();
	});
});
