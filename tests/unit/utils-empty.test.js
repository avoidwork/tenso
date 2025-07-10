import assert from "node:assert";
import { empty } from "../../src/utils/empty.js";

describe("empty", () => {
	it("should return true for empty arrays", () => {
		assert.strictEqual(empty([]), true);
	});

	it("should return false for non-empty arrays", () => {
		assert.strictEqual(empty([1]), false);
		assert.strictEqual(empty([1, 2, 3]), false);
		assert.strictEqual(empty(["a", "b"]), false);
	});

	it("should return true for empty strings", () => {
		assert.strictEqual(empty(""), true);
	});

	it("should return false for non-empty strings", () => {
		assert.strictEqual(empty("hello"), false);
		assert.strictEqual(empty("a"), false);
		assert.strictEqual(empty(" "), false);
	});

	it("should work with any object that has a length property", () => {
		const obj1 = { length: 0 };
		const obj2 = { length: 5 };
		const obj3 = { length: 1 };

		assert.strictEqual(empty(obj1), true);
		assert.strictEqual(empty(obj2), false);
		assert.strictEqual(empty(obj3), false);
	});

	it("should handle Buffer objects", () => {
		const emptyBuffer = Buffer.alloc(0);
		const nonEmptyBuffer = Buffer.from("hello");

		assert.strictEqual(empty(emptyBuffer), true);
		assert.strictEqual(empty(nonEmptyBuffer), false);
	});

	it("should handle Set objects", () => {
		const emptySet = new Set();
		const nonEmptySet = new Set([1, 2, 3]);

		assert.strictEqual(empty(emptySet), true);
		assert.strictEqual(empty(nonEmptySet), false);
	});

	it("should handle Map objects", () => {
		const emptyMap = new Map();
		const nonEmptyMap = new Map([["key", "value"]]);

		assert.strictEqual(empty(emptyMap), true);
		assert.strictEqual(empty(nonEmptyMap), false);
	});

	it("should handle TypedArray objects", () => {
		const emptyTypedArray = new Uint8Array(0);
		const nonEmptyTypedArray = new Uint8Array([1, 2, 3]);

		assert.strictEqual(empty(emptyTypedArray), true);
		assert.strictEqual(empty(nonEmptyTypedArray), false);
	});
});
