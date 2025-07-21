import assert from "node:assert";
import {json} from "../../src/renderers/json.js";

describe("renderers - json", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "application/json"
			},
			server: {
				jsonIndent: 2
			}
		};

		mockRes = {
			statusCode: 200
		};
	});

	it("should render object as JSON", () => {
		const data = {name: "John", age: 30};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.name, "John");
		assert.strictEqual(parsed.age, 30);
	});

	it("should render array as JSON", () => {
		const data = [1, 2, 3, "test"];

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.ok(Array.isArray(parsed));
		assert.strictEqual(parsed.length, 4);
		assert.strictEqual(parsed[3], "test");
	});

	it("should handle null values", () => {
		const data = {value: null};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.value, null);
	});

	it("should handle boolean values", () => {
		const data = {enabled: true, disabled: false};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.enabled, true);
		assert.strictEqual(parsed.disabled, false);
	});

	it("should handle string values", () => {
		const data = {message: "Hello World"};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.message, "Hello World");
	});

	it("should handle number values", () => {
		const data = {
			integer: 42,
			float: 3.14,
			negative: -10,
			zero: 0
		};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.integer, 42);
		assert.strictEqual(parsed.float, 3.14);
		assert.strictEqual(parsed.negative, -10);
		assert.strictEqual(parsed.zero, 0);
	});

	it("should handle nested objects", () => {
		const data = {
			user: {
				name: "John",
				details: {
					age: 30,
					location: "NYC"
				}
			}
		};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.user.name, "John");
		assert.strictEqual(parsed.user.details.age, 30);
		assert.strictEqual(parsed.user.details.location, "NYC");
	});

	it("should handle arrays of objects", () => {
		const data = [
			{name: "John", age: 30},
			{name: "Jane", age: 25}
		];

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.ok(Array.isArray(parsed));
		assert.strictEqual(parsed[0].name, "John");
		assert.strictEqual(parsed[1].name, "Jane");
	});

	it("should use indentation from indent utility", () => {
		mockReq.headers.accept = "application/json; indent=4";
		const data = {level1: {level2: "value"}};

		const result = json(mockReq, mockRes, data);

		// Should contain indentation
		assert.ok(result.includes("\n"));
		assert.ok(result.includes("    ")); // 4 spaces
	});

	it("should fallback to server jsonIndent when no indent in accept header", () => {
		mockReq.headers.accept = "application/json";
		mockReq.server.jsonIndent = 2;
		const data = {level1: {level2: "value"}};

		const result = json(mockReq, mockRes, data);

		// Should contain indentation
		assert.ok(result.includes("\n"));
		assert.ok(result.includes("  ")); // 2 spaces
	});

	it("should handle no indentation", () => {
		mockReq.headers.accept = "application/json";
		mockReq.server.jsonIndent = 0;
		const data = {level1: {level2: "value"}};

		const result = json(mockReq, mockRes, data);

		// Should not contain newlines (compact format)
		assert.ok(!result.includes("\n"));
	});

	it("should handle empty object", () => {
		const data = {};

		const result = json(mockReq, mockRes, data);

		assert.strictEqual(result, "{}");
	});

	it("should handle empty array", () => {
		const data = [];

		const result = json(mockReq, mockRes, data);

		assert.strictEqual(result.trim(), "[]");
	});

	it("should handle primitive values", () => {
		const stringResult = json(mockReq, mockRes, "test");
		const numberResult = json(mockReq, mockRes, 42);
		const booleanResult = json(mockReq, mockRes, true);
		const nullResult = json(mockReq, mockRes, null);

		assert.strictEqual(stringResult, '"test"');
		assert.strictEqual(numberResult, "42");
		assert.strictEqual(booleanResult, "true");
		assert.strictEqual(nullResult, "null");
	});

	it("should handle special characters and escape them properly", () => {
		const data = {
			quote: 'He said "Hello"',
			backslash: "Path\\to\\file",
			newline: "line1\nline2",
			tab: "col1\tcol2"
		};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.quote, 'He said "Hello"');
		assert.strictEqual(parsed.backslash, "Path\\to\\file");
		assert.strictEqual(parsed.newline, "line1\nline2");
		assert.strictEqual(parsed.tab, "col1\tcol2");
	});

	it("should handle Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = {timestamp: testDate};

		const result = json(mockReq, mockRes, data);

		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.timestamp, testDate.toISOString());
	});

	it("should handle large numbers", () => {
		const data = {
			big: Number.MAX_SAFE_INTEGER,
			small: Number.MIN_SAFE_INTEGER,
			infinity: Infinity,
			negInfinity: -Infinity,
			nan: NaN
		};

		const result = json(mockReq, mockRes, data);

		// JSON.stringify converts Infinity and NaN to null
		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.big, Number.MAX_SAFE_INTEGER);
		assert.strictEqual(parsed.small, Number.MIN_SAFE_INTEGER);
		assert.strictEqual(parsed.infinity, null);
		assert.strictEqual(parsed.negInfinity, null);
		assert.strictEqual(parsed.nan, null);
	});

	it("should handle circular references gracefully", () => {
		const data = {name: "test"};
		data.self = data; // Create circular reference

		// This should throw an error due to circular reference
		assert.throws(() => {
			json(mockReq, mockRes, data);
		}, /circular|cyclic/i);
	});
});
