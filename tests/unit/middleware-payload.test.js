import assert from "node:assert";
import { payload } from "../../src/middleware/payload.js";

describe("middleware/payload", () => {
	let mockReq, mockRes, nextCalled, errorCalled, errorCode;

	beforeEach(() => {
		mockReq = {
			method: "POST",
			headers: {
				"content-type": "application/json"
			},
			server: {
				maxBytes: 1024
			},
			setEncoding: () => {},
			on: (event, callback) => {
				mockReq.events = mockReq.events || {};
				mockReq.events[event] = callback;
			}
		};
		mockRes = {
			error: code => {
				errorCalled = true;
				errorCode = code;
			}
		};
		nextCalled = false;
		errorCalled = false;
		errorCode = null;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof payload, "function");
	});

	it("should skip payload collection for GET requests", () => {
		mockReq.method = "GET";

		payload(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should skip payload collection for HEAD requests", () => {
		mockReq.method = "HEAD";

		payload(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should skip payload collection for multipart content", () => {
		mockReq.method = "POST";
		mockReq.headers["content-type"] = "multipart/form-data";

		payload(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should set up data and end event listeners for valid requests", () => {
		let encodingSet = false;
		mockReq.setEncoding = encoding => {
			encodingSet = true;
			assert.strictEqual(encoding, "utf8");
		};

		payload(mockReq, mockRes, mockNext);

		assert.strictEqual(encodingSet, true);
		assert.ok(mockReq.events);
		assert.ok(typeof mockReq.events.data === "function");
		assert.ok(typeof mockReq.events.end === "function");
	});

	it("should collect request body data", () => {
		payload(mockReq, mockRes, mockNext);

		// Simulate data events
		mockReq.events.data("chunk1");
		mockReq.events.data("chunk2");
		mockReq.events.end();

		assert.strictEqual(mockReq.body, "chunk1chunk2");
		assert.strictEqual(nextCalled, true);
	});

	it("should enforce size limits", () => {
		mockReq.server.maxBytes = 10;

		payload(mockReq, mockRes, mockNext);

		// Simulate large data chunk
		mockReq.events.data("this is a very long chunk that exceeds the limit");

		assert.strictEqual(errorCalled, true);
		assert.strictEqual(errorCode, 413);
	});

	it("should handle zero maxBytes (no limit)", () => {
		mockReq.server.maxBytes = 0;

		payload(mockReq, mockRes, mockNext);

		// Simulate large data chunk
		mockReq.events.data("this is a very long chunk that would normally exceed limits");
		mockReq.events.end();

		assert.strictEqual(errorCalled, false);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle missing content-type header", () => {
		delete mockReq.headers["content-type"];
		mockReq.method = "POST"; // Ensure hasBody returns true

		// Since there's no content-type header, the condition
		// `req.headers?.["content-type"]?.includes(MULTIPART) === false`
		// evaluates to `undefined === false` which is false,
		// so event listeners won't be set up. This is correct behavior.
		payload(mockReq, mockRes, mockNext);

		// Should skip payload collection and call next immediately
		assert.strictEqual(nextCalled, true);
	});

	it("should handle PUT requests", () => {
		mockReq.method = "PUT";

		payload(mockReq, mockRes, mockNext);

		assert.ok(mockReq.events);
		assert.ok(typeof mockReq.events.data === "function");
		assert.ok(typeof mockReq.events.end === "function");
	});

	it("should handle PATCH requests", () => {
		mockReq.method = "PATCH";

		payload(mockReq, mockRes, mockNext);

		assert.ok(mockReq.events);
		assert.ok(typeof mockReq.events.data === "function");
		assert.ok(typeof mockReq.events.end === "function");
	});

	it("should not call next multiple times after error", () => {
		mockReq.server.maxBytes = 5;
		let nextCallCount = 0;
		const countingNext = () => {
			nextCallCount++;
		};

		payload(mockReq, mockRes, countingNext);

		// Simulate exceeding size limit
		mockReq.events.data("large chunk");
		// Simulate end event after error
		mockReq.events.end();

		assert.strictEqual(errorCalled, true);
		assert.strictEqual(nextCallCount, 0); // Should not call next after error
	});

	it("should handle empty request body", () => {
		payload(mockReq, mockRes, mockNext);

		mockReq.events.end();

		assert.strictEqual(mockReq.body, "");
		assert.strictEqual(nextCalled, true);
	});
});
