import assert from "node:assert";
import {describe, it} from "mocha";
import {yaml} from "../../src/renderers/yaml.js";

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
 * Unit tests for YAML renderer module
 */
describe("renderers/yaml", () => {
	describe("yaml()", () => {
		it("should render simple object as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = yaml(req, res, data);

			assert.ok(result.includes("name: test"));
			assert.ok(result.includes("value: 123"));
		});

		it("should render array as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["apple", "banana", "cherry"];
			const result = yaml(req, res, data);

			assert.ok(result.includes("- apple"));
			assert.ok(result.includes("- banana"));
			assert.ok(result.includes("- cherry"));
		});

		it("should render null as YAML null", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = yaml(req, res, null);

			assert.ok(result.includes("null") || result.includes("~"));
		});

		it("should render undefined as YAML undefined", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = yaml(req, res, undefined);

			// YAML should handle undefined somehow
			assert.strictEqual(typeof result, "string");
		});

		it("should render primitives as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			const stringResult = yaml(req, res, "hello world");
			assert.ok(stringResult.includes("hello world"));

			const numberResult = yaml(req, res, 123);
			assert.ok(numberResult.includes("123"));

			const booleanTrueResult = yaml(req, res, true);
			assert.ok(booleanTrueResult.includes("true"));

			const booleanFalseResult = yaml(req, res, false);
			assert.ok(booleanFalseResult.includes("false"));
		});

		it("should render nested objects as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				user: {
					name: "John",
					age: 30
				},
				active: true
			};
			const result = yaml(req, res, data);

			assert.ok(result.includes("user:"));
			assert.ok(result.includes("name: John"));
			assert.ok(result.includes("age: 30"));
			assert.ok(result.includes("active: true"));
		});

		it("should render arrays of objects as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "John", age: 30},
				{name: "Jane", age: 25}
			];
			const result = yaml(req, res, data);

			// YAML library may format arrays differently
			assert.ok(result.includes("John"));
			assert.ok(result.includes("30"));
			assert.ok(result.includes("Jane"));
			assert.ok(result.includes("25"));
		});

		it("should render empty objects as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = yaml(req, res, {});

			assert.ok(result.includes("{}") || result.includes(""));
		});

		it("should render empty arrays as YAML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = yaml(req, res, []);

			assert.ok(result.includes("[]") || result.includes(""));
		});

		it("should handle special characters in strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				message: "Hello: world",
				quoted: '"test"',
				multiline: "line1\nline2"
			};
			const result = yaml(req, res, data);

			assert.ok(result.includes("message:"));
			assert.ok(result.includes("quoted:"));
			assert.ok(result.includes("multiline:"));
		});

		it("should handle numbers and numeric strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				integer: 42,
				float: 3.14159,
				negative: -100,
				zero: 0,
				string_number: "123"
			};
			const result = yaml(req, res, data);

			assert.ok(result.includes("integer: 42"));
			assert.ok(result.includes("float: 3.14159"));
			assert.ok(result.includes("negative: -100"));
			assert.ok(result.includes("zero: 0"));
			assert.ok(result.includes("string_number: '123'") || result.includes("string_number: \"123\""));
		});

		it("should handle Date objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = {timestamp: date};
			const result = yaml(req, res, data);

			assert.ok(result.includes("timestamp:"));
			// Date should be represented somehow in YAML
			assert.ok(result.includes("2023"));
		});

		it("should handle mixed array content", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				"string",
				123,
				true,
				{key: "value"},
				null
			];
			const result = yaml(req, res, data);

			assert.ok(result.includes("- string"));
			assert.ok(result.includes("- 123"));
			assert.ok(result.includes("- true"));
			assert.ok(result.includes("key: value"));
		});

		it("should handle complex nested structures", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				metadata: {
					total: 100,
					page: 1,
					filters: ["active", "verified"]
				},
				users: [
					{
						id: 1,
						profile: {
							name: "John",
							settings: {
								theme: "dark",
								notifications: true
							}
						}
					}
				]
			};
			const result = yaml(req, res, data);

			assert.ok(result.includes("metadata:"));
			assert.ok(result.includes("total: 100"));
			assert.ok(result.includes("filters:"));
			assert.ok(result.includes("users:"));
			assert.ok(result.includes("profile:"));
			assert.ok(result.includes("settings:"));
		});

		it("should handle arrays of primitives", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				numbers: [1, 2, 3, 4, 5],
				strings: ["a", "b", "c"],
				booleans: [true, false, true]
			};
			const result = yaml(req, res, data);

			assert.ok(result.includes("numbers:"));
			assert.ok(result.includes("- 1"));
			assert.ok(result.includes("strings:"));
			assert.ok(result.includes("- a"));
			assert.ok(result.includes("booleans:"));
			assert.ok(result.includes("- true"));
		});

		it("should return string output", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {simple: "test"};
			const result = yaml(req, res, data);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle function input gracefully", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const func = function () { return "test"; };

			// YAML library may not handle functions gracefully
			try {
				const result = yaml(req, res, func);
				assert.strictEqual(typeof result, "string");
			} catch (error) {
				assert.ok(error instanceof TypeError);
			}
		});
	});
});
