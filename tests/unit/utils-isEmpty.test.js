import assert from "node:assert";
import { isEmpty } from "../../src/utils/isEmpty.js";

describe("isEmpty", () => {
	it("should return true for empty string", () => {
		assert.strictEqual(isEmpty(""), true);
	});

	it("should return false for non-empty strings", () => {
		assert.strictEqual(isEmpty("hello"), false);
		assert.strictEqual(isEmpty("world"), false);
		assert.strictEqual(isEmpty("a"), false);
	});

	it("should return false for strings with whitespace", () => {
		assert.strictEqual(isEmpty(" "), false);
		assert.strictEqual(isEmpty("  "), false);
		assert.strictEqual(isEmpty("\t"), false);
		assert.strictEqual(isEmpty("\n"), false);
	});

	it("should return false for numbers", () => {
		assert.strictEqual(isEmpty(0), false);
		assert.strictEqual(isEmpty(1), false);
		assert.strictEqual(isEmpty(-1), false);
		assert.strictEqual(isEmpty(42), false);
	});

	it("should return false for booleans", () => {
		assert.strictEqual(isEmpty(true), false);
		assert.strictEqual(isEmpty(false), false);
	});

	it("should return false for null", () => {
		assert.strictEqual(isEmpty(null), false);
	});

	it("should return false for undefined", () => {
		assert.strictEqual(isEmpty(undefined), false);
	});

	it("should return false for objects", () => {
		assert.strictEqual(isEmpty({}), false);
		assert.strictEqual(isEmpty({ a: 1 }), false);
	});

	it("should return false for arrays", () => {
		assert.strictEqual(isEmpty([]), false);
		assert.strictEqual(isEmpty([1, 2, 3]), false);
	});

	it("should return false for functions", () => {
		assert.strictEqual(isEmpty(() => {}), false);
		assert.strictEqual(isEmpty(function () {}), false);
	});

	it("should return false for symbols", () => {
		assert.strictEqual(isEmpty(Symbol("test")), false);
	});

	it("should return false for dates", () => {
		assert.strictEqual(isEmpty(new Date()), false);
	});

	it("should return false for regex", () => {
		assert.strictEqual(isEmpty(/test/), false);
	});

	it("should handle default parameter correctly", () => {
		assert.strictEqual(isEmpty(), true);
	});

	it("should work with EMPTY constant equivalent", () => {
		// Test that it works with what would be the EMPTY constant
		assert.strictEqual(isEmpty(""), true);
	});

	it("should handle string representations of empty", () => {
		assert.strictEqual(isEmpty("null"), false);
		assert.strictEqual(isEmpty("undefined"), false);
		assert.strictEqual(isEmpty("false"), false);
		assert.strictEqual(isEmpty("0"), false);
	});
});
