import assert from "node:assert";
import {plain} from "../../src/renderers/plain.js";

describe("renderers - plain", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "text/plain"
			},
			server: {
				json: 0
			}
		};

		mockRes = {
			statusCode: 200
		};
	});

	it("should render string as plain text", () => {
		const data = "Hello World";

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "Hello World");
	});

	it("should render number as string", () => {
		const data = 42;

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "42");
	});

	it("should render boolean as string", () => {
		const trueResult = plain(mockReq, mockRes, true);
		const falseResult = plain(mockReq, mockRes, false);

		assert.strictEqual(trueResult, "true");
		assert.strictEqual(falseResult, "false");
	});

	it("should handle null values by returning 'null'", () => {
		const data = null;

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "null");
	});

	it("should handle undefined values by returning empty string", () => {
		const data = undefined;

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "");
	});

	it("should render object as JSON string", () => {
		const data = {name: "John", age: 30};

		const result = plain(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.name, "John");
		assert.strictEqual(parsed.age, 30);
	});

	it("should render array of primitives with comma separation", () => {
		const data = [1, 2, 3, "test"];

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "1,2,3,test");
	});

	it("should render array of objects recursively", () => {
		const data = [{name: "John"}, {name: "Jane"}];

		const result = plain(mockReq, mockRes, data);

		assert.ok(result.includes('"name":"John"'));
		assert.ok(result.includes('"name":"Jane"'));
		assert.ok(result.includes(","));
	});

	it("should handle nested arrays", () => {
		const data = [1, [2, 3], 4];

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "1,2,3,4");
	});

	it("should handle mixed array types", () => {
		const data = ["string", 42, true, {key: "value"}];

		const result = plain(mockReq, mockRes, data);

		const parts = result.split(",");
		assert.strictEqual(parts[0], "string");
		assert.strictEqual(parts[1], "42");
		assert.strictEqual(parts[2], "true");
		assert.ok(parts[3].includes("key"));
	});

	it("should handle empty array", () => {
		const data = [];

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "");
	});

	it("should handle empty object", () => {
		const data = {};

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "{}");
	});

	it("should handle deeply nested structures", () => {
		const data = {
			level1: {
				level2: {
					level3: "deep value"
				}
			}
		};

		const result = plain(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.level1.level2.level3, "deep value");
	});

	it("should handle special characters in strings", () => {
		const data = "Hello \"world\"\nNew line\tTab";

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "Hello \"world\"\nNew line\tTab");
	});

	it("should handle Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = testDate;

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, testDate.toISOString());
	});

	it("should handle objects containing Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = {timestamp: testDate};

		const result = plain(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.timestamp, testDate.toISOString());
	});

	it("should use indentation from indent utility for objects", () => {
		mockReq.headers.accept = "text/plain; indent=2";
		mockReq.server.json = 2;
		const data = {level1: {level2: "value"}};

		const result = plain(mockReq, mockRes, data);

		// Should contain indentation for object JSON
		assert.ok(result.includes("\n"));
		assert.ok(result.includes("  "));
	});

	it("should handle zero values correctly", () => {
		const data = [0, "0", false];

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "0,0,false");
	});

	it("should handle arrays with null and undefined gracefully", () => {
		const data = [null, undefined, "test"];

		const result = plain(mockReq, mockRes, data);

		assert.strictEqual(result, "null,,test");
	});

	it("should handle very large numbers", () => {
		const data = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

		const result = plain(mockReq, mockRes, data);

		const parts = result.split(",");
		assert.strictEqual(parts[0], Number.MAX_SAFE_INTEGER.toString());
		assert.strictEqual(parts[1], Number.MIN_SAFE_INTEGER.toString());
	});

	it("should handle Infinity and NaN", () => {
		const data = [Infinity, -Infinity, NaN];

		const result = plain(mockReq, mockRes, data);

		const parts = result.split(",");
		assert.strictEqual(parts[0], "Infinity");
		assert.strictEqual(parts[1], "-Infinity");
		assert.strictEqual(parts[2], "NaN");
	});

	it("should handle functions by converting to string", () => {
		const data = function test () { return "hello"; };

		const result = plain(mockReq, mockRes, data);

		assert.ok(result.includes("function"));
		assert.ok(result.includes("test"));
	});

	it("should handle symbols by converting to string", () => {
		const data = Symbol("test");

		const result = plain(mockReq, mockRes, data);

		assert.ok(result.includes("Symbol"));
		assert.ok(result.includes("test"));
	});

	it("should handle arrays containing mixed primitive and object types (except null)", () => {
		const data = [
			"string",
			42,
			true,
			{object: "value"},
			[1, 2, 3]
		];

		const result = plain(mockReq, mockRes, data);

		assert.ok(result.includes("string"));
		assert.ok(result.includes("42"));
		assert.ok(result.includes("true"));
		assert.ok(result.includes("object"));
		assert.ok(result.includes("1,2,3"));
	});
});
