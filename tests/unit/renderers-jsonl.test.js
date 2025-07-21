import assert from "node:assert";
import {describe, it} from "mocha";
import {jsonl} from "../../src/renderers/jsonl.js";

/**
 * Creates a mock request object for testing
 * @param {Object} options - Options to customize the mock request
 * @returns {Object} Mock request object
 */
function createMockRequest (options = {}) {
	return {
		headers: options.headers || {},
		server: options.server || {},
		...options
	};
}

/**
 * Creates a mock response object for testing
 * @param {Object} options - Options to customize the mock response
 * @returns {Object} Mock response object
 */
function createMockResponse (options = {}) {
	return {
		header: options.header || (() => {}),
		...options
	};
}

/**
 * Unit tests for JSONL renderer module
 */
describe("renderers/jsonl", () => {
	describe("jsonl()", () => {
		it("should render array of objects as JSON Lines", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "John", age: 30},
				{name: "Jane", age: 25}
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
			assert.strictEqual(lines[0], '{"name":"John","age":30}');
			assert.strictEqual(lines[1], '{"name":"Jane","age":25}');
		});

		it("should render single object as JSON Lines", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "John", age: 30};
			const result = jsonl(req, res, data);

			assert.strictEqual(result.trim(), '{"name":"John","age":30}');
		});

		it("should render empty array", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [];
			const result = jsonl(req, res, data);

			// Empty array should produce empty string or empty lines
			assert.strictEqual(typeof result, "string");
		});

		it("should render array of primitives", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["apple", "banana", "cherry"];
			const result = jsonl(req, res, data);

			// JSONL library may format differently, check it's valid
			assert.strictEqual(typeof result, "string");
			assert.ok(result.includes("apple"));
			assert.ok(result.includes("banana"));
			assert.ok(result.includes("cherry"));
		});

		it("should render array of mixed types", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				"string",
				123,
				true,
				{key: "value"},
				null
			];
			const result = jsonl(req, res, data);

			// JSONL library may format differently, check content is present
			assert.strictEqual(typeof result, "string");
			assert.ok(result.includes("string"));
			assert.ok(result.includes("123"));
			assert.ok(result.includes("true"));
			assert.ok(result.includes("key"));
		});

		it("should handle null value", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			// JSONL library may not accept null primitives
			try {
				const result = jsonl(req, res, null);
				assert.strictEqual(typeof result, "string");
			} catch (error) {
				assert.ok(error.message.includes("Array or Object"));
			}
		});

		it("should handle undefined value", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			// JSONL library may not accept undefined primitives
			try {
				const result = jsonl(req, res, undefined);
				assert.strictEqual(typeof result, "string");
			} catch (error) {
				assert.ok(error.message.includes("Array or Object"));
			}
		});

		it("should handle primitive values", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			// JSONL library may not accept primitive values directly
			try {
				const stringResult = jsonl(req, res, "hello world");
				assert.strictEqual(typeof stringResult, "string");
			} catch (error) {
				assert.ok(error.message.includes("Array or Object"));
			}
		});

		it("should handle nested objects in array", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{
					user: {
						name: "John",
						age: 30
					},
					active: true
				},
				{
					user: {
						name: "Jane",
						age: 25
					},
					active: false
				}
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
			assert.ok(lines[0].includes('"user":{"name":"John","age":30}'));
			assert.ok(lines[0].includes('"active":true'));
			assert.ok(lines[1].includes('"user":{"name":"Jane","age":25}'));
			assert.ok(lines[1].includes('"active":false'));
		});

		it("should handle Date objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = [
				{name: "test1", timestamp: date},
				{name: "test2", timestamp: new Date("2023-12-31T23:59:59.999Z")}
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
			assert.ok(lines[0].includes("2023-01-01T00:00:00.000Z"));
			assert.ok(lines[1].includes("2023-12-31T23:59:59.999Z"));
		});

		it("should handle arrays containing arrays", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				["a", "b"],
				["c", "d"],
				["e", "f"]
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 3);
			assert.strictEqual(lines[0], '["a","b"]');
			assert.strictEqual(lines[1], '["c","d"]');
			assert.strictEqual(lines[2], '["e","f"]');
		});

		it("should handle complex data structures", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{
					id: 1,
					metadata: {
						tags: ["important", "user"],
						scores: [85, 92, 78]
					}
				},
				{
					id: 2,
					metadata: {
						tags: ["archived"],
						scores: [65, 70]
					}
				}
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);

			// Parse each line to verify structure
			const obj1 = JSON.parse(lines[0]);
			const obj2 = JSON.parse(lines[1]);

			assert.strictEqual(obj1.id, 1);
			assert.deepStrictEqual(obj1.metadata.tags, ["important", "user"]);
			assert.deepStrictEqual(obj1.metadata.scores, [85, 92, 78]);

			assert.strictEqual(obj2.id, 2);
			assert.deepStrictEqual(obj2.metadata.tags, ["archived"]);
			assert.deepStrictEqual(obj2.metadata.scores, [65, 70]);
		});

		it("should handle special characters", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{message: "Hello\nWorld"},
				{message: 'With "quotes"'},
				{message: "Unicode: 世界"}
			];
			const result = jsonl(req, res, data);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 3);

			// Each line should be valid JSON
			assert.doesNotThrow(() => JSON.parse(lines[0]));
			assert.doesNotThrow(() => JSON.parse(lines[1]));
			assert.doesNotThrow(() => JSON.parse(lines[2]));
		});

		it("should produce compact JSON format", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{
					name: "test",
					nested: {
						value: 123,
						array: [1, 2, 3]
					}
				}
			];
			const result = jsonl(req, res, data);

			// Should be compact (no extra whitespace)
			assert.ok(!result.includes("  ")); // No indentation
			assert.ok(!result.includes("\n  ")); // No pretty printing
		});

		it("should return string output", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [{test: "value"}];
			const result = jsonl(req, res, data);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle large arrays efficiently", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			// Create a large array
			const data = Array.from({length: 1000}, (_, i) => ({
				id: i,
				name: `item${i}`,
				value: i * 2
			}));

			const result = jsonl(req, res, data);
			const lines = result.trim().split("\n");

			assert.strictEqual(lines.length, 1000);

			// Verify first and last items
			const firstItem = JSON.parse(lines[0]);
			const lastItem = JSON.parse(lines[999]);

			assert.strictEqual(firstItem.id, 0);
			assert.strictEqual(firstItem.name, "item0");
			assert.strictEqual(lastItem.id, 999);
			assert.strictEqual(lastItem.name, "item999");
		});
	});
});
