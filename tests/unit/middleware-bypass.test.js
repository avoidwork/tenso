import assert from "node:assert";
import { bypass } from "../../src/middleware/bypass.js";

describe("middleware/bypass", () => {
	let mockReq, mockRes, nextCalled;

	beforeEach(() => {
		mockReq = {
			cors: false,
			method: "GET",
			url: "/test",
			server: {
				auth: {
					unprotect: []
				}
			}
		};
		mockRes = {};
		nextCalled = false;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof bypass, "function");
	});

	it("should set unprotect to false for regular requests", () => {
		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, false);
		assert.strictEqual(nextCalled, true);
	});

	it("should set unprotect to true for CORS OPTIONS requests", () => {
		mockReq.cors = true;
		mockReq.method = "OPTIONS";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should set unprotect to false for CORS non-OPTIONS requests", () => {
		mockReq.cors = true;
		mockReq.method = "GET";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, false);
		assert.strictEqual(nextCalled, true);
	});

	it("should set unprotect to true when URL matches unprotect patterns", () => {
		mockReq.server.auth.unprotect = [/^\/public/, /^\/health/];
		mockReq.url = "/public/test";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should set unprotect to false when URL does not match unprotect patterns", () => {
		mockReq.server.auth.unprotect = [/^\/public/, /^\/health/];
		mockReq.url = "/private/test";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, false);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle multiple unprotect patterns", () => {
		mockReq.server.auth.unprotect = [/^\/public/, /^\/health/, /^\/assets/];
		mockReq.url = "/health/check";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should prioritize CORS OPTIONS over auth patterns", () => {
		mockReq.cors = true;
		mockReq.method = "OPTIONS";
		mockReq.server.auth.unprotect = [];
		mockReq.url = "/private/test";

		bypass(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.unprotect, true);
		assert.strictEqual(nextCalled, true);
	});
});
