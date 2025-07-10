import assert from "node:assert";
import { zuul } from "../../src/middleware/zuul.js";

describe("middleware/zuul", () => {
	let mockReq, mockRes, nextCalled, errorCalled, exitCalled;

	beforeEach(() => {
		exitCalled = false;
		mockReq = {
			url: "/protected/resource",
			unprotect: false,
			server: {
				auth: {
					protect: [/^\/protected/, /^\/admin/]
				},
				rate: {
					enabled: true,
					status: 429,
					reset: 900
				},
				rateLimit: () => [true, 100, 99, 1609459200] // good, limit, remaining, reset
			},
			exit: () => {
				exitCalled = true;
			}
		};
		mockRes = {
			headers: {},
			header: function (key, value) {
				this.headers[key] = value;
			},
			error: () => {
				errorCalled = true;
			}
		};
		nextCalled = false;
		errorCalled = false;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof zuul, "function");
	});

	it("should set protect to true and call next for protected URLs", () => {
		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(mockReq.protectAsync, false);
		assert.strictEqual(nextCalled, true);
		assert.strictEqual(exitCalled, false);
	});

	it("should set protect to false and call exit for unprotected URLs", () => {
		mockReq.url = "/public/resource";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, false);
		assert.strictEqual(mockReq.protectAsync, false);
		assert.strictEqual(nextCalled, false);
		assert.strictEqual(exitCalled, true);
	});

	it("should handle unprotect flag being true", () => {
		mockReq.unprotect = true;
		mockReq.url = "/protected/resource";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, false);
		assert.strictEqual(exitCalled, true);
	});

	it("should handle rate limiting errors", () => {
		mockReq.server.rateLimit = () => [false, 100, 0, 1609459200]; // rate limit exceeded

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(errorCalled, true);
		assert.strictEqual(nextCalled, false);
		assert.strictEqual(exitCalled, false);
	});

	it("should handle multiple protect patterns", () => {
		mockReq.url = "/admin/users";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle empty protect patterns", () => {
		mockReq.server.auth.protect = [];
		mockReq.url = "/any/path";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, false);
		assert.strictEqual(exitCalled, true);
	});

	it("should handle pattern matching correctly", () => {
		mockReq.server.auth.protect = [/^\/api\/v1/];
		mockReq.url = "/api/v1/users";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle pattern not matching", () => {
		mockReq.server.auth.protect = [/^\/api\/v1/];
		mockReq.url = "/api/v2/users";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, false);
		assert.strictEqual(exitCalled, true);
	});

	it("should stop at first matching protect pattern", () => {
		mockReq.server.auth.protect = [/^\/protected/, /^\/admin/, /^\/protected\/special/];
		mockReq.url = "/protected/resource";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle rate limiting with custom configuration", () => {
		let rateParams;

		mockReq.server.rateLimit = (req, overrideParam) => {
			rateParams = { req, overrideParam };

			return [true, 200, 199, 1609459200];
		};

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(rateParams.req, mockReq);
		assert.strictEqual(nextCalled, true);
	});

	it("should always set protectAsync to false", () => {
		// Test protected URL
		mockReq.url = "/protected/resource";
		zuul(mockReq, mockRes, mockNext);
		assert.strictEqual(mockReq.protectAsync, false);

		// Reset and test unprotected URL
		mockReq.protectAsync = undefined;
		mockReq.url = "/public/resource";
		zuul(mockReq, mockRes, mockNext);
		assert.strictEqual(mockReq.protectAsync, false);
	});

	it("should handle complex URL patterns", () => {
		mockReq.server.auth.protect = [/^\/api\/v[0-9]+\/admin/];
		mockReq.url = "/api/v1/admin/users";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle root path protection", () => {
		mockReq.server.auth.protect = [/^\/$/];
		mockReq.url = "/";

		zuul(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protect, true);
		assert.strictEqual(nextCalled, true);
	});
});
