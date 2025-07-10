import assert from "node:assert";
import { guard } from "../../src/middleware/guard.js";

describe("middleware/guard", () => {
	let mockReq, mockRes, nextCalled, errorCalled, errorCode;

	beforeEach(() => {
		mockReq = {
			url: "/protected",
			server: {
				auth: {
					uri: {
						login: "/auth/login"
					}
				}
			},
			isAuthenticated: () => false
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
		assert.strictEqual(typeof guard, "function");
	});

	it("should allow access to login URL", () => {
		mockReq.url = "/auth/login";

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should allow access for authenticated users", () => {
		mockReq.isAuthenticated = () => true;

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should return 401 for unauthenticated users on protected routes", () => {
		mockReq.isAuthenticated = () => false;
		mockReq.url = "/protected/resource";

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(errorCalled, true);
		assert.strictEqual(errorCode, 401);
	});

	it("should handle different login URLs", () => {
		mockReq.server.auth.uri.login = "/custom/login";
		mockReq.url = "/custom/login";

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should handle authenticated user with custom login URL", () => {
		mockReq.server.auth.uri.login = "/custom/login";
		mockReq.url = "/protected/resource";
		mockReq.isAuthenticated = () => true;

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should handle missing isAuthenticated method", () => {
		delete mockReq.isAuthenticated;
		mockReq.url = "/protected/resource";

		try {
			guard(mockReq, mockRes, mockNext);
			assert.fail("Should have thrown an error");
		} catch (err) {
			assert.ok(err instanceof TypeError);
		}
	});

	it("should handle complex login URL paths", () => {
		mockReq.server.auth.uri.login = "/auth/oauth/login";
		mockReq.url = "/auth/oauth/login";

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should reject partial login URL matches", () => {
		mockReq.server.auth.uri.login = "/auth/login";
		mockReq.url = "/auth/login/callback";

		guard(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(errorCalled, true);
		assert.strictEqual(errorCode, 401);
	});
});
