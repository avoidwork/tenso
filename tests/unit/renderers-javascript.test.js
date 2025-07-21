import assert from "node:assert";
import {javascript} from "../../src/renderers/javascript.js";

describe("renderers - javascript", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "application/json"
			},
			parsed: {
				searchParams: new URLSearchParams()
			}
		};

		mockRes = {
			statusCode: 200,
			header: function (name, value) {
				this.headers = this.headers || {};
				this.headers[name] = value;
			},
			headers: {}
		};
	});

	it("should render JSONP with default callback name", () => {
		const data = {message: "hello world"};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.startsWith("callback("));
		assert.ok(result.endsWith(");"));
		assert.ok(result.includes("\"message\":\"hello world\""));
	});

	it("should use custom callback name from query params", () => {
		mockReq.parsed.searchParams.set("callback", "myCallback");
		const data = {test: "value"};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.startsWith("myCallback("));
		assert.ok(result.endsWith(");"));
		assert.ok(result.includes("\"test\":\"value\""));
	});

	it("should set correct content-type header", () => {
		const data = {test: "value"};

		javascript(mockReq, mockRes, data);

		assert.strictEqual(mockRes.headers["content-type"], "application/javascript");
	});

	it("should modify request accept header", () => {
		const data = {test: "value"};

		javascript(mockReq, mockRes, data);

		assert.strictEqual(mockReq.headers.accept, "application/javascript");
	});

	it("should handle array data", () => {
		const data = [1, 2, 3, {name: "test"}];

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("[1,2,3,{\"name\":\"test\"}]"));
	});

	it("should handle null data", () => {
		const data = null;

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback(null);"));
	});

	it("should handle undefined data", () => {
		const data = undefined;

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback(undefined);"));
	});

	it("should handle string data", () => {
		const data = "simple string";

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("\"simple string\""));
	});

	it("should handle number data", () => {
		const data = 42;

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback(42);"));
	});

	it("should handle boolean data", () => {
		const data = true;

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback(true);"));
	});

	it("should handle complex nested objects", () => {
		const data = {
			user: {
				name: "John",
				preferences: {
					theme: "dark",
					notifications: true
				}
			},
			metadata: {
				version: "1.0",
				timestamp: new Date("2023-01-01").toISOString()
			}
		};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("\"name\":\"John\""));
		assert.ok(result.includes("\"theme\":\"dark\""));
		assert.ok(result.includes("\"notifications\":true"));
		assert.ok(result.includes("\"version\":\"1.0\""));
	});

	it("should escape special characters in JSON", () => {
		const data = {
			message: "Hello \"world\"",
			path: "C:\\Users\\test",
			newline: "line1\nline2"
		};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("\\\"world\\\""));
		assert.ok(result.includes("\\\\"));
		assert.ok(result.includes("\\n"));
	});

	it("should handle empty object", () => {
		const data = {};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback({});"));
	});

	it("should handle empty array", () => {
		const data = [];

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.includes("callback([]);"));
	});

	it("should handle callback names with special characters", () => {
		mockReq.parsed.searchParams.set("callback", "my.callback.func");
		const data = {test: "value"};

		const result = javascript(mockReq, mockRes, data);

		assert.ok(result.startsWith("my.callback.func("));
	});

	it("should use compact JSON format (no indentation)", () => {
		const data = {
			level1: {
				level2: {
					level3: "deep"
				}
			}
		};

		const result = javascript(mockReq, mockRes, data);

		// Should not contain newlines or extra spaces (compact format)
		assert.ok(!result.includes("\n"));
		assert.ok(!result.includes("  "));
	});
});
