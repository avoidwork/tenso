import assert from "node:assert";
import { parse } from "../../src/middleware/parse.js";

describe("middleware/parse", () => {
	let mockReq, mockRes, nextCalled, nextError;

	beforeEach(() => {
		mockReq = {
			body: '{"test": "data"}', // Non-empty body to trigger parsing
			headers: {
				"content-type": "application/json"
			},
			server: {
				parsers: new Map()
			}
		};
		mockRes = {};
		nextCalled = false;
		nextError = null;
	});

	const mockNext = error => {
		nextCalled = true;
		nextError = error;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof parse, "function");
	});

	it("should skip parsing when body is empty", () => {
		mockReq.body = "";

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.strictEqual(mockReq.body, "");
	});

	it("should skip parsing when no content-type header", () => {
		delete mockReq.headers["content-type"];

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.strictEqual(mockReq.body, '{"test": "data"}');
	});

	it("should skip parsing when no parser for content type", () => {
		mockReq.headers["content-type"] = "text/plain";

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.strictEqual(mockReq.body, '{"test": "data"}');
	});

	it("should parse body using registered parser", () => {
		const jsonParser = body => JSON.parse(body);
		mockReq.server.parsers.set("application/json", jsonParser);

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.deepStrictEqual(mockReq.body, { test: "data" });
	});

	it("should handle parsing errors", () => {
		const failingParser = () => {
			throw new Error("Parse error");
		};
		mockReq.server.parsers.set("application/json", failingParser);

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.ok(nextError instanceof Error);
		assert.strictEqual(nextError.message, "Parse error");
	});

	it("should handle content-type with charset", () => {
		// Ensure body is not empty and parser exists
		assert.notStrictEqual(mockReq.body, "");
		mockReq.headers["content-type"] = "application/json; charset=utf-8";

		// Track if parser was called
		let parserCalled = false;
		const jsonParser = body => {
			parserCalled = true;

			return JSON.parse(body);
		};
		// Register parser for just the base content-type since middleware strips after space
		mockReq.server.parsers.set("application/json", jsonParser);

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		// Verify parser was called (content-type was correctly processed)
		assert.strictEqual(parserCalled, true);
		// After parsing, body should be the parsed object
		assert.deepStrictEqual(mockReq.body, { test: "data" });
	});

	it("should handle missing headers object", () => {
		delete mockReq.headers;

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.strictEqual(mockReq.body, '{"test": "data"}');
	});

	it("should handle different content types", () => {
		mockReq.headers["content-type"] = "application/x-www-form-urlencoded";
		mockReq.body = "key=value&foo=bar";
		const formParser = body => {
			const result = {};
			body.split("&").forEach(pair => {
				const [key, value] = pair.split("=");
				result[key] = value;
			});

			return result;
		};
		mockReq.server.parsers.set("application/x-www-form-urlencoded", formParser);

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		assert.deepStrictEqual(mockReq.body, { key: "value", foo: "bar" });
	});

	it("should handle complex content-type headers", () => {
		// Ensure body is not empty and parser exists
		assert.notStrictEqual(mockReq.body, "");
		mockReq.headers["content-type"] = "application/json ;boundary=something;charset=utf-8";

		// Track if parser was called
		let parserCalled = false;
		const jsonParser = body => {
			parserCalled = true;

			return JSON.parse(body);
		};
		// Register parser for just the base content-type since middleware strips after space
		mockReq.server.parsers.set("application/json", jsonParser);

		parse(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
		// Verify parser was called (content-type was correctly processed)
		assert.strictEqual(parserCalled, true);
		// After parsing, body should be the parsed object
		assert.deepStrictEqual(mockReq.body, { test: "data" });
	});
});
