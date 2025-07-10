import assert from "node:assert";
import { random } from "../../src/utils/random.js";

describe("random", () => {
	it("should return a number between 1 and 100 by default", () => {
		const result = random();
		assert.strictEqual(typeof result, "number");
		assert.ok(result >= 1 && result <= 100);
	});

	it("should return a number between 1 and n", () => {
		const result = random(10);
		assert.strictEqual(typeof result, "number");
		assert.ok(result >= 1 && result <= 10);
	});

	it("should handle small values", () => {
		const result = random(1);
		assert.strictEqual(result, 1);
	});

	it("should handle large values", () => {
		const result = random(1000);
		assert.strictEqual(typeof result, "number");
		assert.ok(result >= 1 && result <= 1000);
	});

	it("should return integers only", () => {
		for (let i = 0; i < 10; i++) {
			const result = random(10);
			assert.strictEqual(Number.isInteger(result), true);
		}
	});

	it("should generate different values across multiple calls", () => {
		const results = new Set();
		for (let i = 0; i < 20; i++) {
			results.add(random(100));
		}
		// Should have some variation (at least 10 different values out of 20)
		assert.ok(results.size >= 10);
	});

	it("should handle edge case with value 2", () => {
		const result = random(2);
		assert.ok(result === 1 || result === 2);
	});

	it("should consistently return values in range", () => {
		const n = 50;
		for (let i = 0; i < 100; i++) {
			const result = random(n);
			assert.ok(result >= 1 && result <= n, `Value ${result} should be between 1 and ${n}`);
		}
	});

	it("should handle larger ranges", () => {
		const result = random(10000);
		assert.strictEqual(typeof result, "number");
		assert.ok(result >= 1 && result <= 10000);
	});

	it("should generate reasonably distributed values", () => {
		const n = 10;
		const counts = new Array(n).fill(0);
		const iterations = 1000;

		for (let i = 0; i < iterations; i++) {
			const result = random(n);
			counts[result - 1]++;
		}

		// Each value should appear at least once in 1000 iterations
		for (let i = 0; i < n; i++) {
			assert.ok(counts[i] > 0, `Value ${i + 1} should appear at least once`);
		}
	});
});
