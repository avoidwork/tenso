import assert from "node:assert";
import { serialize } from "../../src/utils/serialize.js";

describe("serialize", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			server: {
				mimeType: "application/json",
				logging: {
					stackWire: false
				}
			},
			parsed: {
				searchParams: new URLSearchParams()
			},
			headers: {}
		};

		mockRes = {
			statusCode: 200,
			_headers: {},
			getHeader: function (name) {
				return this._headers[name.toLowerCase()];
			},
			header: function (name, value) {
				this._headers[name.toLowerCase()] = value;
			},
			removeHeader: function (name) {
				delete this._headers[name.toLowerCase()];
			}
		};
	});

	it("should serialize with default application/json format", () => {
		const data = { message: "hello" };
		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle format parameter from query string", () => {
		const data = { message: "hello" };
		mockReq.parsed.searchParams.set("format", "text/plain");

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/plain; charset=utf-8");
	});

	it("should handle accept header", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "text/plain";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/plain; charset=utf-8");
	});

	it("should handle existing content-type header", () => {
		const data = { message: "hello" };
		mockRes.header("content-type", "text/plain");

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/plain; charset=utf-8");
	});

	it("should handle multiple accept types", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "text/html, application/json, text/plain";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		// Should pick the first supported type
		assert.strictEqual(mockRes.getHeader("content-type"), "text/html; charset=utf-8");
	});

	it("should handle error objects", () => {
		const error = new Error("Test error");
		mockRes.statusCode = 500;

		const result = serialize(mockReq, mockRes, error);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle 400+ status codes as errors", () => {
		const data = { message: "Bad request" };
		mockRes.statusCode = 400;

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle status codes less than 400 as success", () => {
		const data = { message: "success" };
		mockRes.statusCode = 200;

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle stackWire logging option", () => {
		const error = new Error("Test error");
		mockRes.statusCode = 500;
		mockReq.server.logging.stackWire = true;

		const result = serialize(mockReq, mockRes, error);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle unsupported content types", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "unknown/type";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		// Should fallback to default
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle empty accept header", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle null data", () => {
		const data = null;

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result !== undefined);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle undefined data", () => {
		const data = undefined;

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result !== undefined);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should remove existing content-type header before setting new one", () => {
		const data = { message: "hello" };
		mockRes.header("content-type", "text/html");

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/html; charset=utf-8");
	});

	it("should handle YAML content type", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "application/yaml";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/yaml; charset=utf-8");
	});

	it("should handle XML content type", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "application/xml";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/xml; charset=utf-8");
	});

	it("should handle CSV content type", () => {
		const data = [{ id: 1, name: "John" }];
		mockReq.headers.accept = "text/csv";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/csv; charset=utf-8");
	});

	it("should handle HTML content type", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "text/html";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "text/html; charset=utf-8");
	});

	it("should handle JavaScript content type", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "application/javascript";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/javascript; charset=utf-8");
	});

	it("should handle JSONL content type", () => {
		const data = [{ id: 1 }, { id: 2 }];
		mockReq.headers.accept = "application/jsonl";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/jsonl; charset=utf-8");
	});

	it("should handle content type with parameters", () => {
		const data = { message: "hello" };
		mockReq.headers.accept = "application/json; q=0.9";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle arrays as data", () => {
		const data = [{ id: 1 }, { id: 2 }];

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle primitive data types", () => {
		const data = "hello world";

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});

	it("should handle 500 status as error even with valid data", () => {
		const data = { message: "hello" };
		mockRes.statusCode = 500;

		const result = serialize(mockReq, mockRes, data);

		assert.ok(result);
		assert.strictEqual(mockRes.getHeader("content-type"), "application/json; charset=utf-8");
	});
});
