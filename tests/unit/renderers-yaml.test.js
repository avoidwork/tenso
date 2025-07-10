import assert from "node:assert";
import {yaml} from "../../src/renderers/yaml.js";

describe("renderers - yaml", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "application/yaml"
			}
		};

		mockRes = {
			statusCode: 200
		};
	});

	it("should render object as YAML", () => {
		const data = {name: "John", age: 30};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("name: John"));
		assert.ok(result.includes("age: 30"));
	});

	it("should render array as YAML", () => {
		const data = ["item1", "item2", "item3"];

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("- item1"));
		assert.ok(result.includes("- item2"));
		assert.ok(result.includes("- item3"));
	});

	it("should handle string values", () => {
		const data = {message: "Hello World"};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("message: 'Hello World'"));
	});

	it("should handle number values", () => {
		const data = {
			integer: 42,
			float: 3.14,
			negative: -10,
			zero: 0
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("integer: 42"));
		assert.ok(result.includes("float: 3.14"));
		assert.ok(result.includes("negative: -10"));
		assert.ok(result.includes("zero: 0"));
	});

	it("should handle boolean values", () => {
		const data = {enabled: true, disabled: false};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("enabled: true"));
		assert.ok(result.includes("disabled: false"));
	});

	it("should handle null values", () => {
		const data = {value: null};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("value: null") || result.includes("value:"));
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

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("user:"));
		assert.ok(result.includes("name: John"));
		assert.ok(result.includes("details:"));
		assert.ok(result.includes("age: 30"));
		assert.ok(result.includes("location: NYC"));
	});

	it("should handle arrays within objects", () => {
		const data = {
			tags: ["javascript", "node", "yaml"],
			numbers: [1, 2, 3]
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("tags:"));
		assert.ok(result.includes("- javascript"));
		assert.ok(result.includes("- node"));
		assert.ok(result.includes("- yaml"));

		assert.ok(result.includes("numbers:"));
		assert.ok(result.includes("- 1"));
		assert.ok(result.includes("- 2"));
		assert.ok(result.includes("- 3"));
	});

	it("should handle special characters in strings", () => {
		const data = {
			message: "Hello \"world\"",
			path: "C:\\Users\\test",
			multiline: "line1\nline2"
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("message:"));
		assert.ok(result.includes("path:"));
		assert.ok(result.includes("multiline:"));
		// YAML should handle special characters appropriately
		assert.strictEqual(typeof result, "string");
		assert.ok(result.length > 0);
	});

	it("should handle empty object", () => {
		const data = {};

		const result = yaml(mockReq, mockRes, data);

		assert.strictEqual(result.trim(), "{}");
	});

	it("should handle empty array", () => {
		const data = [];

		const result = yaml(mockReq, mockRes, data);

		assert.strictEqual(result.trim(), "[]");
	});

	it("should handle array of objects", () => {
		const data = [
			{name: "John", age: 30},
			{name: "Jane", age: 25}
		];

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("name: John"));
		assert.ok(result.includes("age: 30"));
		assert.ok(result.includes("name: Jane"));
		assert.ok(result.includes("age: 25"));
	});

	it("should handle primitive values", () => {
		const stringResult = yaml(mockReq, mockRes, "test string");
		const numberResult = yaml(mockReq, mockRes, 42);
		const booleanResult = yaml(mockReq, mockRes, true);
		const nullResult = yaml(mockReq, mockRes, null);

		assert.strictEqual(stringResult.trim(), "'test string'");
		assert.strictEqual(numberResult.trim(), "42");
		assert.strictEqual(booleanResult.trim(), "true");
		assert.strictEqual(nullResult.trim(), "null");
	});

	it("should handle Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = {timestamp: testDate};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("timestamp:"));
		assert.ok(result.includes(testDate.toISOString()));
	});

	it("should handle mixed array types", () => {
		const data = ["string", 42, true, null, {key: "value"}];

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("- string"));
		assert.ok(result.includes("- 42"));
		assert.ok(result.includes("- true"));
		assert.ok(result.includes("- null"));
		assert.ok(result.includes("key: value"));
	});

	it("should handle deeply nested structures", () => {
		const data = {
			level1: {
				level2: {
					level3: {
						level4: "deep value"
					}
				}
			}
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("level1:"));
		assert.ok(result.includes("level2:"));
		assert.ok(result.includes("level3:"));
		assert.ok(result.includes("level4: 'deep value'"));
	});

	it("should handle objects with numeric keys", () => {
		const data = {
			"1": "first",
			"2": "second",
			"normal": "key"
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("1: first") || result.includes("'1': first"));
		assert.ok(result.includes("2: second") || result.includes("'2': second"));
		assert.ok(result.includes("normal: key"));
	});

	it("should handle arrays of arrays", () => {
		const data = {
			matrix: [
				[1, 2],
				[3, 4]
			]
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("matrix:"));
		assert.ok(result.includes("1"));
		assert.ok(result.includes("2"));
		assert.ok(result.includes("3"));
		assert.ok(result.includes("4"));
	});

	it("should handle special YAML values", () => {
		const data = {
			infinity: Infinity,
			negInfinity: -Infinity,
			notANumber: NaN
		};

		const result = yaml(mockReq, mockRes, data);

		// YAML handles special values differently than JSON
		assert.ok(result.includes("infinity:"));
		assert.ok(result.includes("negInfinity:"));
		assert.ok(result.includes("notANumber:"));
	});

	it("should handle objects with undefined values", () => {
		const data = {
			defined: "value",
			undefined: undefined
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("defined: value"));
		// undefined values might be omitted or rendered as null
		assert.strictEqual(typeof result, "string");
	});

	it("should maintain proper YAML indentation", () => {
		const data = {
			level1: {
				level2: {
					array: [
						{item: "value1"},
						{item: "value2"}
					]
				}
			}
		};

		const result = yaml(mockReq, mockRes, data);

		// YAML should have proper indentation structure
		assert.ok(result.includes("\n"));
		assert.ok(result.includes("  ")); // Should contain indentation
		assert.ok(result.includes("level1:"));
		assert.ok(result.includes("level2:"));
		assert.ok(result.includes("array:"));
	});

	it("should handle Unicode characters", () => {
		const data = {
			emoji: "😀🎉",
			unicode: "Hello 世界",
			symbols: "α β γ"
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("emoji:"));
		assert.ok(result.includes("unicode:"));
		assert.ok(result.includes("symbols:"));
		assert.strictEqual(typeof result, "string");
	});

	it("should handle large numbers", () => {
		const data = {
			big: Number.MAX_SAFE_INTEGER,
			small: Number.MIN_SAFE_INTEGER,
			scientific: 1.23e-10
		};

		const result = yaml(mockReq, mockRes, data);

		assert.ok(result.includes("big:"));
		assert.ok(result.includes("small:"));
		assert.ok(result.includes("scientific:"));
		assert.ok(result.includes(Number.MAX_SAFE_INTEGER.toString()));
	});
});
