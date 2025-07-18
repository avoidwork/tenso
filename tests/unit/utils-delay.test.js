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
});
