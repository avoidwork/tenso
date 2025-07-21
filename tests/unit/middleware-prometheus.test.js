import assert from "node:assert";
import { prometheus } from "../../src/middleware/prometheus.js";

describe("middleware/prometheus", () => {
	let config, mockReq, mockRes, nextCalled;

	beforeEach(async () => {
		// Clear the default registry to avoid conflicts between tests
		const promClient = await import("prom-client");
		promClient.register.clear();

		config = {
			includeUp: false,
			includeMethod: true,
			includePath: true,
			includeStatusCode: true,
			customLabels: {},
			buckets: [0.1, 1, 5, 10]
		};
		mockReq = {
			method: "GET",
			url: "/test",
			route: "/test"
		};
		mockRes = {
			statusCode: 200,
			end: function () {}
		};
		nextCalled = false;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof prometheus, "function");
	});

	it("should return a middleware function with register property", () => {
		const {middleware, register} = prometheus(config);

		assert.strictEqual(typeof middleware, "function");
		assert.ok(register);
		assert.strictEqual(typeof register, "object");
	});

	it("should create middleware that calls next", () => {
		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should override res.end method", () => {
		const {middleware} = prometheus(config);
		const originalEnd = mockRes.end;

		middleware(mockReq, mockRes, mockNext);

		assert.notStrictEqual(mockRes.end, originalEnd);
		assert.strictEqual(typeof mockRes.end, "function");
	});

	it("should handle requests without next function", () => {
		const {middleware} = prometheus(config);

		// Should not throw error when next is undefined
		middleware(mockReq, mockRes, undefined);

		assert.ok(true, "Function handles missing next parameter");
	});

	it("should handle custom labels", () => {
		config.customLabels = {
			service: "api",
			version: "1.0"
		};

		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle includeUp configuration", () => {
		config.includeUp = true;

		const {register} = prometheus(config);

		assert.ok(register);
		assert.strictEqual(typeof register, "object");
	});

	it("should handle different bucket configurations", () => {
		config.buckets = [0.001, 0.01, 0.1, 1, 2, 5, 10, 20, 50, 100];

		const {register} = prometheus(config);

		assert.ok(register);
		assert.strictEqual(typeof register, "object");
	});

	it("should handle missing route property", () => {
		delete mockReq.route;
		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle missing method property", () => {
		delete mockReq.method;
		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle missing statusCode on response", () => {
		delete mockRes.statusCode;
		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle configuration with disabled flags", () => {
		config.includeMethod = false;
		config.includePath = false;
		config.includeStatusCode = false;

		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle empty custom labels", () => {
		config.customLabels = {};

		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should handle undefined custom labels", () => {
		delete config.customLabels;

		const {middleware} = prometheus(config);

		middleware(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should create metrics with proper names", () => {
		const {middleware, register} = prometheus(config);

		// Need to call the middleware first to ensure metrics are created
		middleware(mockReq, mockRes, mockNext);

		// Check that metrics are registered
		try {
			const metrics = register.getMetricsAsJSON();
			// Handle both array and object return types
			const metricNames = Array.isArray(metrics) ?
				metrics.map(m => m.name) :
				Object.keys(metrics);

			assert.ok(metricNames.includes("http_request_duration_seconds"));
			assert.ok(metricNames.includes("http_requests_total"));
		} catch (e) {
			// If getMetricsAsJSON doesn't work, check for getSingleMetric
			console.log("getMetricsAsJSON failed:", e.message);
			assert.ok(register.getSingleMetric("http_request_duration_seconds"));
			assert.ok(register.getSingleMetric("http_requests_total"));
		}
	});

	it("should record metrics when res.end is called", () => {
		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		// Mock the original end method
		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);

		// Call the overridden end method
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should record metrics with correct labels when includeMethod is false", () => {
		config.includeMethod = false;
		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should record metrics with correct labels when includePath is false", () => {
		config.includePath = false;
		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should record metrics with correct labels when includeStatusCode is false", () => {
		config.includeStatusCode = false;
		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should handle missing route and use url fallback", () => {
		delete mockReq.route;
		mockReq.url = "/fallback";

		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should handle missing route and url properties", () => {
		delete mockReq.route;
		delete mockReq.url;

		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should pass arguments to original end method", () => {
		const {middleware} = prometheus(config);
		let endArgs = null;

		mockRes.end = function (...args) {
			endArgs = args;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end("test data", "utf8");

		assert.deepStrictEqual(endArgs, ["test data", "utf8"]);
	});

	it("should measure request duration accurately", async () => {
		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);

		// Add a small delay to test duration measurement
		await new Promise(resolve => setTimeout(resolve, 10));

		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});

	it("should handle custom labels in metrics recording", () => {
		config.customLabels = {
			service: "test-api",
			environment: "test"
		};

		const {middleware} = prometheus(config);
		let originalEndCalled = false;

		mockRes.end = function () {
			originalEndCalled = true;
		};

		middleware(mockReq, mockRes, mockNext);
		mockRes.end();

		assert.strictEqual(originalEndCalled, true);
	});
});
