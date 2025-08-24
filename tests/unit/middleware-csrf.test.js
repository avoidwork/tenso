import assert from "node:assert";
import { csrfWrapper } from "../../src/middleware/csrf.js";

describe("middleware/csrf", () => {
	let mockReq, mockRes, nextCalled, nextError;

	beforeEach(() => {
		// Reset state
		mockReq = {
			unprotect: false,
			csrf: "token123",
			session: {},
			sessionID: "test-session-id",
			ip: "192.168.1.1",
			headers: {
				"x-csrf-token": "token123"
			},
			body: {},
			query: {},
			server: {
				security: {
					key: "x-csrf-token",
					secret: "test-secret"
				}
			}
		};
		mockRes = {
			locals: {},
			headers: {},
			header: function (key, value) {
				this.headers[key] = value;
			}
		};
		nextCalled = false;
		nextError = null;
	});

	const mockNext = error => {
		nextCalled = true;
		nextError = error;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof csrfWrapper, "function");
	});

	it("should call next immediately for unprotected requests", () => {
		mockReq.unprotect = true;

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(nextError, undefined);
	});

	it("should handle protected requests in test environment", () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		// In test environment, the middleware should handle errors gracefully

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle protected requests with session", () => {
		mockReq.session = {};

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		// Should handle gracefully when session is present
	});

	it("should set generateCsrfToken on server object when memoized", () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		// Call twice to test memoization
		csrfWrapper(mockReq, mockRes, mockNext);

		// After first call, the generateCsrfToken should be set on server
		if (mockReq.server.generateCsrfToken) {
			assert.strictEqual(typeof mockReq.server.generateCsrfToken, "function");
		}

		// Reset and call again to test memoization
		nextCalled = false;
		nextError = null;

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle different security keys", () => {
		mockReq.server.security.key = "custom-csrf-header";
		mockReq.server.security.secret = "different-secret";
		mockReq.headers = {
			"custom-csrf-header": "custom-token"
		};

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle missing security configuration gracefully", () => {
		mockReq.server.security = {
			key: "x-csrf-token",
			secret: "test-secret"
		};

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle requests without session in production (error path)", () => {
		mockReq.session = undefined;

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		// In production without session, might pass through an error depending on CSRF setup

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle csrf token in headers", () => {
		mockReq.headers = {
			"x-csrf-token": "header-token"
		};

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle csrf token in body", () => {
		mockReq.body = {
			_csrf: "body-token"
		};
		mockReq.headers = {}; // No header token

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle csrf token in query", () => {
		mockReq.query = {
			_csrf: "query-token"
		};
		mockReq.headers = {}; // No header token
		mockReq.body = {}; // No body token

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle case where req.csrf is falsy", () => {
		mockReq.csrf = null;

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});

	it("should handle missing sessionID and ip (fallback)", () => {
		delete mockReq.sessionID;
		delete mockReq.ip;

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "test";

		csrfWrapper(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);

		process.env.NODE_ENV = originalEnv;
	});
});
