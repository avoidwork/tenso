import assert from "node:assert";
import { chunk } from "../../src/utils/chunk.js";

describe("chunk", () => {
	it("should split an array into chunks of size 2 by default", () => {
		const result = chunk([1, 2, 3, 4]);
		assert.deepStrictEqual(result, [[1, 2], [3, 4]]);
	});

	it("should split an array into chunks of specified size", () => {
		const result = chunk([1, 2, 3, 4, 5, 6], 3);
		assert.deepStrictEqual(result, [[1, 2, 3], [4, 5, 6]]);
	});

	it("should handle arrays that don't divide evenly", () => {
		const result = chunk([1, 2, 3, 4, 5], 2);
		assert.deepStrictEqual(result, [[1, 2], [3, 4], [5]]);
	});

	it("should handle empty arrays", () => {
		const result = chunk([]);
		assert.deepStrictEqual(result, []);
	});

	it("should handle size larger than array length", () => {
		const result = chunk([1, 2], 5);
		assert.deepStrictEqual(result, [[1, 2]]);
	});

	it("should handle size of 1", () => {
		const result = chunk([1, 2, 3], 1);
		assert.deepStrictEqual(result, [[1], [2], [3]]);
	});

	it("should handle single element arrays", () => {
		const result = chunk([1]);
		assert.deepStrictEqual(result, [[1]]);
	});

	it("should handle arrays with different data types", () => {
		const result = chunk(["a", "b", "c", "d"], 2);
		assert.deepStrictEqual(result, [["a", "b"], ["c", "d"]]);
	});

	it("should handle arrays with objects", () => {
		const obj1 = { id: 1 };
		const obj2 = { id: 2 };
		const obj3 = { id: 3 };
		const result = chunk([obj1, obj2, obj3], 2);
		assert.deepStrictEqual(result, [[obj1, obj2], [obj3]]);
	});

	it("should handle undefined input gracefully", () => {
		const result = chunk(undefined, 2);
		assert.deepStrictEqual(result, []);
	});

	it("should handle null input gracefully", () => {
		const result = chunk(null, 2);
		assert.deepStrictEqual(result, []);
	});
});
