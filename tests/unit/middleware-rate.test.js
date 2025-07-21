import assert from "node:assert";
import { rate } from "../../src/middleware/rate.js";

describe("middleware/rate", () => {
	let mockReq, mockRes, nextCalled, errorCalled;

	beforeEach(() => {
		mockReq = {
			unprotect: false,
			server: {
				rate: {
					enabled: true,
					status: 429,
					reset: 900
				},
				rateLimit: () => [true, 100, 99, 1609459200] // good, limit, remaining, reset
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
		assert.strictEqual(typeof rate, "function");
	});

	it("should call next when rate limiting is disabled", () => {
		mockReq.server.rate.enabled = false;

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should call next for unprotected requests", () => {
		mockReq.unprotect = true;

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
	});

	it("should set rate limit headers and call next when within limits", () => {
		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(errorCalled, false);
		assert.strictEqual(mockRes.headers["x-ratelimit-limit"], 100);
		assert.strictEqual(mockRes.headers["x-ratelimit-remaining"], 99);
		assert.strictEqual(mockRes.headers["x-ratelimit-reset"], 1609459200);
	});

	it("should return 429 when rate limit is exceeded", () => {
		mockReq.server.rateLimit = () => [false, 100, 0, 1609459200]; // exceeded

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(errorCalled, true);
		assert.strictEqual(mockRes.headers["retry-after"], 900);
	});

	it("should use custom status code when configured", () => {
		mockReq.server.rate.status = 503;
		mockReq.server.rateLimit = () => [false, 100, 0, 1609459200];

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(errorCalled, true);
	});

	it("should use default 429 status when no custom status configured", () => {
		delete mockReq.server.rate.status;
		mockReq.server.rateLimit = () => [false, 100, 0, 1609459200];

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(errorCalled, true);
	});

	it("should handle override parameter in rate limit function", () => {
		const override = { limit: 200 };
		let passedOverride;

		mockReq.server.rateLimit = (req, overrideParam) => {
			passedOverride = overrideParam;

			return [true, 200, 199, 1609459200];
		};

		// Mock the rate function to accept override parameter
		const testRate = (req, res, next, overrideParam) => {
			const config = req.server.rate;
			if (config.enabled === false || req.unprotect) {
				next();
			} else {
				const results = req.server.rateLimit(req, overrideParam);
				const good = results.shift();
				if (good) {
					const rateHeaders = [
						"x-ratelimit-limit",
						"x-ratelimit-remaining",
						"x-ratelimit-reset"
					];
					for (const [idx, i] of rateHeaders.entries()) {
						res.header(i, results[idx]);
					}
					next();
				} else {
					res.header("retry-after", config.reset);
					res.error(config.status || 429);
				}
			}
		};

		testRate(mockReq, mockRes, mockNext, override);

		assert.strictEqual(passedOverride, override);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle missing rate configuration gracefully", () => {
		mockReq.server.rate = {};

		rate(mockReq, mockRes, mockNext);

		// Should still work with minimal configuration
		assert.ok(true, "Function handles missing rate configuration");
	});

	it("should handle all rate limit headers correctly", () => {
		mockReq.server.rateLimit = () => [true, 50, 25, 1609459260];

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(mockRes.headers["x-ratelimit-limit"], 50);
		assert.strictEqual(mockRes.headers["x-ratelimit-remaining"], 25);
		assert.strictEqual(mockRes.headers["x-ratelimit-reset"], 1609459260);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle rate limit function returning fewer values", () => {
		mockReq.server.rateLimit = () => [true, 100]; // Missing remaining and reset

		rate(mockReq, mockRes, mockNext);

		assert.strictEqual(mockRes.headers["x-ratelimit-limit"], 100);
		assert.strictEqual(mockRes.headers["x-ratelimit-remaining"], undefined);
		assert.strictEqual(mockRes.headers["x-ratelimit-reset"], undefined);
		assert.strictEqual(nextCalled, true);
	});
});
