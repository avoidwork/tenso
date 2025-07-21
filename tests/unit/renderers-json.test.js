import assert from "node:assert";
import {describe, it} from "mocha";
import {json} from "../../src/renderers/json.js";

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
 * Unit tests for JSON renderer module
 */
describe("renderers/json", () => {
	describe("json()", () => {
		it("should render simple object as JSON", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"name":"test","value":123}');
		});

		it("should render array as JSON", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["a", "b", "c"];
			const result = json(req, res, data);

			assert.strictEqual(result, '["a","b","c"]');
		});

		it("should render null as JSON null", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = json(req, res, null);

			assert.strictEqual(result, "null");
		});

		it("should convert undefined to null", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = json(req, res, undefined);

			assert.strictEqual(result, "null");
		});

		it("should render primitives as JSON", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			assert.strictEqual(json(req, res, "hello"), '"hello"');
			assert.strictEqual(json(req, res, 123), "123");
			assert.strictEqual(json(req, res, true), "true");
			assert.strictEqual(json(req, res, false), "false");
		});

		it("should handle missing headers gracefully", () => {
			const req = createMockRequest({headers: undefined});
			const res = createMockResponse();
			const data = {test: "value"};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"test":"value"}');
		});

		it("should handle missing server configuration gracefully", () => {
			const req = createMockRequest({server: undefined});
			const res = createMockResponse();
			const data = {test: "value"};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"test":"value"}');
		});

		it("should use server jsonIndent configuration", () => {
			const req = createMockRequest({
				server: {jsonIndent: 2}
			});
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = json(req, res, data);

			assert.strictEqual(result, '{\n  "name": "test",\n  "value": 123\n}');
		});

		it("should use accept header for indentation", () => {
			const req = createMockRequest({
				headers: {accept: "application/json; indent=4"},
				server: {jsonIndent: 0}
			});
			const res = createMockResponse();
			const data = {name: "test"};
			const result = json(req, res, data);

			assert.strictEqual(result, '{\n    "name": "test"\n}');
		});

		it("should handle nested objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				user: {
					name: "John",
					age: 30
				},
				active: true
			};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"user":{"name":"John","age":30},"active":true}');
		});

		it("should handle circular references gracefully", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test"};
			data.self = data; // Create circular reference

			assert.throws(() => {
				json(req, res, data);
			}, TypeError);
		});

		it("should handle special characters", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				message: "Hello 世界",
				path: "C:\\Users\\test",
				quote: '"quoted"'
			};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"message":"Hello 世界","path":"C:\\\\Users\\\\test","quote":"\\"quoted\\""}');
		});

		it("should handle Date objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = {timestamp: date};
			const result = json(req, res, data);

			assert.strictEqual(result, '{"timestamp":"2023-01-01T00:00:00.000Z"}');
		});
	});
});
