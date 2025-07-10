import assert from "node:assert";
import {jsonl} from "../../src/renderers/jsonl.js";

describe("renderers - jsonl", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "application/jsonl"
			}
		};

		mockRes = {
			statusCode: 200
		};
	});

	it("should render array of objects as JSON Lines", () => {
		const data = [
			{name: "John", age: 30},
			{name: "Jane", age: 25}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 2);

		const first = JSON.parse(lines[0]);
		const second = JSON.parse(lines[1]);

		assert.strictEqual(first.name, "John");
		assert.strictEqual(second.name, "Jane");
	});

	it("should render single object as JSON Lines", () => {
		const data = {name: "John", age: 30};

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 1);

		const parsed = JSON.parse(lines[0]);
		assert.strictEqual(parsed.name, "John");
		assert.strictEqual(parsed.age, 30);
	});

	it("should handle empty array", () => {
		const data = [];

		const result = jsonl(mockReq, mockRes, data);

		assert.strictEqual(result.trim(), "[]");
	});

	it("should handle array with mixed data types", () => {
		const data = [
			{type: "object", value: "test"},
			"string value",
			42,
			true,
			null
		];

		const result = jsonl(mockReq, mockRes, data);

		// JSONL renderer outputs each element as a separate line
		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 5);

		const firstObj = JSON.parse(lines[0]);
		assert.strictEqual(firstObj.type, "object");
		assert.strictEqual(firstObj.value, "test");

		assert.strictEqual(lines[1], "string value");
		assert.strictEqual(lines[2], "42");
		assert.strictEqual(lines[3], "true");
		assert.strictEqual(lines[4], "null");
	});

	it("should handle nested objects", () => {
		const data = [
			{
				user: {
					name: "John",
					details: {
						age: 30,
						location: "NYC"
					}
				}
			},
			{
				user: {
					name: "Jane",
					details: {
						age: 25,
						location: "LA"
					}
				}
			}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 2);

		const first = JSON.parse(lines[0]);
		const second = JSON.parse(lines[1]);

		assert.strictEqual(first.user.name, "John");
		assert.strictEqual(first.user.details.age, 30);
		assert.strictEqual(second.user.name, "Jane");
		assert.strictEqual(second.user.details.location, "LA");
	});

	it("should handle objects with special characters", () => {
		const data = [
			{message: "Hello \"world\""},
			{path: "C:\\Users\\test"},
			{content: "line1\nline2\ttab"}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 3);

		const first = JSON.parse(lines[0]);
		const second = JSON.parse(lines[1]);
		const third = JSON.parse(lines[2]);

		assert.strictEqual(first.message, 'Hello "world"');
		assert.strictEqual(second.path, "C:\\Users\\test");
		assert.strictEqual(third.content, "line1\nline2\ttab");
	});

	it("should handle boolean and null values", () => {
		const data = [
			{enabled: true, disabled: false},
			{value: null, missing: undefined}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 2);

		const first = JSON.parse(lines[0]);
		const second = JSON.parse(lines[1]);

		assert.strictEqual(first.enabled, true);
		assert.strictEqual(first.disabled, false);
		assert.strictEqual(second.value, null);
		// undefined values are typically omitted in JSON
		assert.ok(!Object.prototype.hasOwnProperty.call(second, "missing"));
	});

	it("should handle numbers including edge cases", () => {
		const data = [
			{value: 42},
			{value: 3.14},
			{value: -10},
			{value: 0},
			{value: Number.MAX_SAFE_INTEGER}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 5);

		const values = lines.map(line => JSON.parse(line).value);
		assert.strictEqual(values[0], 42);
		assert.strictEqual(values[1], 3.14);
		assert.strictEqual(values[2], -10);
		assert.strictEqual(values[3], 0);
		assert.strictEqual(values[4], Number.MAX_SAFE_INTEGER);
	});

	it("should handle Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = [{timestamp: testDate}];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 1);

		const parsed = JSON.parse(lines[0]);
		assert.strictEqual(parsed.timestamp, testDate.toISOString());
	});

	it("should handle arrays within objects", () => {
		const data = [
			{tags: ["javascript", "node", "json"]},
			{numbers: [1, 2, 3, 4, 5]},
			{mixed: ["string", 42, true, null]}
		];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 3);

		const first = JSON.parse(lines[0]);
		const second = JSON.parse(lines[1]);
		const third = JSON.parse(lines[2]);

		assert.ok(Array.isArray(first.tags));
		assert.strictEqual(first.tags.length, 3);
		assert.strictEqual(first.tags[0], "javascript");

		assert.ok(Array.isArray(second.numbers));
		assert.strictEqual(second.numbers.length, 5);

		assert.ok(Array.isArray(third.mixed));
		assert.strictEqual(third.mixed[1], 42);
		assert.strictEqual(third.mixed[2], true);
	});

	it("should handle empty objects", () => {
		const data = [{}, {name: "test"}, {}];

		const result = jsonl(mockReq, mockRes, data);

		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 3);

		assert.strictEqual(lines[0], "{}");
		assert.ok(lines[1].includes("test"));
		assert.strictEqual(lines[2], "{}");
	});

	it("should produce compact JSON (no indentation)", () => {
		const data = [
			{
				level1: {
					level2: {
						level3: "deep"
					}
				}
			}
		];

		const result = jsonl(mockReq, mockRes, data);

		// Each line should be compact (no newlines within lines)
		const lines = result.trim().split("\n");
		assert.strictEqual(lines.length, 1);
		assert.ok(!lines[0].includes("\n"));
		assert.ok(!lines[0].includes("  ")); // No indentation spaces
	});
});
