import assert from "node:assert";
import { describe, it, beforeEach } from "mocha";
import { tenso } from "../../dist/tenso.js";

describe("Serializers", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 60, logging: { enabled: false } });
	});

	describe("Custom Serializer", () => {
		let customSerializer;

		beforeEach(() => {
			customSerializer = app.serializers.get("application/json");
		});

		it("should serialize successful response with data", () => {
			const data = { name: "test", value: 123 };
			const result = customSerializer(data, null, 200, false);

			assert.deepStrictEqual(result, {
				data: { name: "test", value: 123 },
				error: null,
				links: [],
				status: 200
			});
		});

		it("should serialize error response with message", () => {
			const error = new Error("Something went wrong");
			const result = customSerializer(null, error, 500, false);

			assert.deepStrictEqual(result, {
				data: null,
				error: "Something went wrong",
				links: [],
				status: 500
			});
		});

		it("should serialize error response with stack trace", () => {
			const error = new Error("Stack error");
			const result = customSerializer(null, error, 500, true);

			assert.deepStrictEqual(result, {
				data: null,
				error: error.stack,
				links: [],
				status: 500
			});
		});

		it("should handle string error", () => {
			const error = "String error message";
			const result = customSerializer(null, error, 400, false);

			assert.deepStrictEqual(result, {
				data: null,
				error: "String error message",
				links: [],
				status: 400
			});
		});

		it("should handle empty error with status code fallback", () => {
			const error = "";
			const result = customSerializer(null, error, 404, false);

			assert.deepStrictEqual(result, {
				data: null,
				error: "Not Found", // Should fallback to STATUS_CODES[404]
				links: [],
				status: 404
			});
		});

		it("should handle null error object", () => {
			const error = null;
			const result = customSerializer({ test: "data" }, error, 200, false);

			assert.deepStrictEqual(result, {
				data: { test: "data" },
				error: null,
				links: [],
				status: 200
			});
		});

		it("should handle undefined error with null message", () => {
			const error = { message: null };
			const result = customSerializer(null, error, 500, false);

			assert.deepStrictEqual(result, {
				data: null,
				error: { message: null },
				links: [],
				status: 500
			});
		});

		it("should handle error object with custom toString", () => {
			const error = {
				toString: () => "Custom error representation"
			};
			const result = customSerializer(null, error, 400, false);

			assert.deepStrictEqual(result, {
				data: null,
				error: error,
				links: [],
				status: 400
			});
		});

		it("should use default status code", () => {
			const data = { test: "data" };
			const result = customSerializer(data, null);

			assert.strictEqual(result.status, 200);
		});

		it("should use default stack parameter", () => {
			const error = new Error("Test error");
			const result = customSerializer(null, error, 500);

			// Should use message, not stack (default stack = false)
			assert.strictEqual(result.error, "Test error");
		});

		it("should handle complex data structures", () => {
			const data = {
				users: [
					{ id: 1, name: "John" },
					{ id: 2, name: "Jane" }
				],
				meta: {
					total: 2,
					page: 1
				}
			};
			const result = customSerializer(data, null, 200, false);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, null);
			assert.strictEqual(result.status, 200);
		});
	});

	describe("Plain Serializer", () => {
		let plainSerializer;

		beforeEach(() => {
			plainSerializer = app.serializers.get("text/plain");
		});

		it("should return data directly for successful response", () => {
			const data = { name: "test", value: 123 };
			const result = plainSerializer(data, null, 200, false);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should return error message for error response", () => {
			const error = new Error("Something went wrong");
			const result = plainSerializer(null, error, 500, false);

			assert.strictEqual(result, "Something went wrong");
		});

		it("should return error stack when requested", () => {
			const error = new Error("Stack error");
			const result = plainSerializer(null, error, 500, true);

			assert.strictEqual(result, error.stack);
		});

		it("should handle string error", () => {
			const error = "String error message";
			const result = plainSerializer(null, error, 400, false);

			assert.strictEqual(result, "String error message");
		});

		it("should handle empty error with status code fallback", () => {
			const error = "";
			const result = plainSerializer(null, error, 404, false);

			assert.strictEqual(result, "Not Found");
		});

		it("should handle null error", () => {
			const data = "test data";
			const result = plainSerializer(data, null, 200, false);

			assert.strictEqual(result, "test data");
		});

		it("should handle array data", () => {
			const data = [1, 2, 3, "test"];
			const result = plainSerializer(data, null, 200, false);

			assert.deepStrictEqual(result, [1, 2, 3, "test"]);
		});

		it("should handle primitive data types", () => {
			assert.strictEqual(plainSerializer("string", null, 200), "string");
			assert.strictEqual(plainSerializer(123, null, 200), 123);
			assert.strictEqual(plainSerializer(true, null, 200), true);
			assert.strictEqual(plainSerializer(null, null, 200), null);
		});

		it("should handle undefined error with null message", () => {
			const error = { message: null };
			const result = plainSerializer(null, error, 500, false);

			assert.deepStrictEqual(result, { message: null });
		});

		it("should handle error object with custom toString", () => {
			const error = {
				toString: () => "Custom error representation"
			};
			const result = plainSerializer(null, error, 400, false);

			assert.deepStrictEqual(result, error);
		});

		it("should use default status code", () => {
			const data = "test";
			const result = plainSerializer(data, null);

			assert.strictEqual(result, "test");
		});

		it("should use default stack parameter", () => {
			const error = new Error("Test error");
			const result = plainSerializer(null, error, 500);

			// Should use message, not stack (default stack = false)
			assert.strictEqual(result, "Test error");
		});
	});

	describe("Serializers Map", () => {
		it("should contain all expected serializers", () => {
			const expectedSerializers = [
				"application/json",
				"application/yaml",
				"application/xml",
				"text/plain",
				"application/javascript",
				"text/csv",
				"text/html",
				"application/json-lines",
				"application/jsonl",
				"text/json-lines"
			];

			for (const serializer of expectedSerializers) {
				assert(app.serializers.has(serializer), `Missing serializer: ${serializer}`);
			}
		});

		it("should have correct number of serializers", () => {
			assert.strictEqual(app.serializers.size, 10);
		});

		it("should map JSON-like formats to custom serializer", () => {
			const jsonSerializer = app.serializers.get("application/json");
			const yamlSerializer = app.serializers.get("application/yaml");
			const xmlSerializer = app.serializers.get("application/xml");
			const jsSerializer = app.serializers.get("application/javascript");
			const htmlSerializer = app.serializers.get("text/html");

			// These should all use the custom serializer
			assert.strictEqual(jsonSerializer, yamlSerializer);
			assert.strictEqual(jsonSerializer, xmlSerializer);
			assert.strictEqual(jsonSerializer, jsSerializer);
			assert.strictEqual(jsonSerializer, htmlSerializer);
		});

		it("should map plain text formats to plain serializer", () => {
			const plainSerializer = app.serializers.get("text/plain");
			const csvSerializer = app.serializers.get("text/csv");
			const jsonlSerializer = app.serializers.get("application/jsonl");
			const jsonLinesSerializer = app.serializers.get("application/json-lines");
			const textJsonLinesSerializer = app.serializers.get("text/json-lines");

			// These should all use the plain serializer
			assert.strictEqual(plainSerializer, csvSerializer);
			assert.strictEqual(plainSerializer, jsonlSerializer);
			assert.strictEqual(plainSerializer, jsonLinesSerializer);
			assert.strictEqual(plainSerializer, textJsonLinesSerializer);
		});

		it("should allow adding custom serializers", () => {
			const customSerializer = (data, err, status) => ({ custom: true, data, err, status });
			app.serializer("text/custom", customSerializer);

			assert(app.serializers.has("text/custom"));
			assert.strictEqual(app.serializers.get("text/custom"), customSerializer);
		});
	});

	describe("Error Handling Edge Cases", () => {
		let customSerializer, plainSerializer;

		beforeEach(() => {
			customSerializer = app.serializers.get("application/json");
			plainSerializer = app.serializers.get("text/plain");
		});

		it("should handle error with no message property", () => {
			const error = { code: "ERR001", details: "Some details" };

			const customResult = customSerializer(null, error, 500, false);
			const plainResult = plainSerializer(null, error, 500, false);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});

		it("should handle error with empty message", () => {
			const error = { message: "" };

			const customResult = customSerializer(null, error, 400, false);
			const plainResult = plainSerializer(null, error, 400, false);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});

		it("should handle error with undefined message", () => {
			const error = { message: undefined };

			const customResult = customSerializer(null, error, 403, false);
			const plainResult = plainSerializer(null, error, 403, false);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});

		it("should handle unknown status codes", () => {
			const error = new Error("Custom error");

			const customResult = customSerializer(null, error, 999, false);
			const plainResult = plainSerializer(null, error, 999, false);

			// Should fall back to error message when status code is unknown
			assert.strictEqual(customResult.error, "Custom error");
			assert.strictEqual(plainResult, "Custom error");
		});

		it("should handle circular references in error objects", () => {
			const error = { message: "Circular error" };
			error.self = error; // Create circular reference

			const customResult = customSerializer(null, error, 500, false);
			const plainResult = plainSerializer(null, error, 500, false);

			assert.strictEqual(customResult.error, "Circular error");
			assert.strictEqual(plainResult, "Circular error");
		});

		it("should handle error with numeric message", () => {
			const error = { message: 404 };

			const customResult = customSerializer(null, error, 500, false);
			const plainResult = plainSerializer(null, error, 500, false);

			assert.strictEqual(customResult.error, 404);
			assert.strictEqual(plainResult, 404);
		});

		it("should handle error with boolean message", () => {
			const error = { message: false };

			const customResult = customSerializer(null, error, 500, false);
			const plainResult = plainSerializer(null, error, 500, false);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});
	});

	describe("Stack Trace Handling", () => {
		let customSerializer, plainSerializer;

		beforeEach(() => {
			customSerializer = app.serializers.get("application/json");
			plainSerializer = app.serializers.get("text/plain");
		});

		it("should prefer stack over message when stack=true", () => {
			const error = new Error("Test message");
			error.stack = "Error: Test message\n    at test.js:1:1";

			const customResult = customSerializer(null, error, 500, true);
			const plainResult = plainSerializer(null, error, 500, true);

			assert.strictEqual(customResult.error, error.stack);
			assert.strictEqual(plainResult, error.stack);
		});

		it("should fallback to message when stack is undefined", () => {
			const error = new Error("Test message");
			error.stack = undefined;

			const customResult = customSerializer(null, error, 500, true);
			const plainResult = plainSerializer(null, error, 500, true);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});

		it("should fallback to message when stack is empty string", () => {
			const error = new Error("Test message");
			error.stack = "";

			const customResult = customSerializer(null, error, 500, true);
			const plainResult = plainSerializer(null, error, 500, true);

			assert.deepStrictEqual(customResult.error, error);
			assert.deepStrictEqual(plainResult, error);
		});
	});
});
