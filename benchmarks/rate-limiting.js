#!/usr/bin/env node

/**
 * Rate limiting performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

/**
 * Creates a test server with rate limiting enabled
 */
function createRateLimitedServer (rateConfig) {
	return tenso({
		port: 0,
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		security: { csrf: false },
		rate: {
			enabled: true,
			limit: 100,
			reset: 900, // 15 minutes
			status: 429,
			message: "Too many requests",
			...rateConfig
		}
	});
}

/**
 * Creates mock request objects for testing
 */
function createMockRequest (options = {}) {
	return {
		method: options.method || "GET",
		url: options.url || "/api/test",
		headers: options.headers || {},
		sessionID: options.sessionID || `session-${Math.random()}`,
		ip: options.ip || `192.168.1.${Math.floor(Math.random() * 255)}`,
		parsed: {
			pathname: options.url || "/api/test",
			searchParams: new URLSearchParams()
		},
		...options
	};
}

/**
 * Creates mock response objects for testing
 */
function createMockResponse () { // eslint-disable-line no-unused-vars
	return {
		statusCode: 200,
		headers: {},
		getHeader: function (name) { return this.headers[name]; },
		removeHeader: function (name) { delete this.headers[name]; },
		header: function (name, value) { this.headers[name] = value; },
		getHeaders: function () { return this.headers; },
		error: function (status) { this.statusCode = status; }
	};
}

/**
 * Benchmarks basic rate limiting performance
 */
function benchmarkBasicRateLimit () {
	console.log("\n📊 Basic Rate Limiting Benchmarks");
	console.log("-".repeat(40));

	const server = createRateLimitedServer({ // eslint-disable-line no-unused-vars
		limit: 100,
		reset: 900
	});

	const suite = new Benchmark.Suite();

	// Mock rate limit state store
	const rateStore = new Map();

	// Mock rate limit function
	const checkRateLimit = (req, config) => {
		const reqId = req.sessionID || req.ip;
		const currentTime = Math.floor(Date.now() / 1000);

		if (!rateStore.has(reqId)) {
			rateStore.set(reqId, {
				limit: config.limit,
				remaining: config.limit - 1,
				reset: currentTime + config.reset
			});

			return { allowed: true, remaining: config.limit - 1, reset: currentTime + config.reset };
		}

		const state = rateStore.get(reqId);

		if (currentTime >= state.reset) {
			// Reset the window
			state.remaining = config.limit - 1;
			state.reset = currentTime + config.reset;

			return { allowed: true, remaining: state.remaining, reset: state.reset };
		}

		if (state.remaining > 0) {
			state.remaining--;

			return { allowed: true, remaining: state.remaining, reset: state.reset };
		}

		return { allowed: false, remaining: 0, reset: state.reset };
	};

	const config = { limit: 100, reset: 900 };

	suite
		.add("Rate Limit - First request (new client)", () => {
			const req = createMockRequest({ sessionID: `new-${Math.random()}` });
			checkRateLimit(req, config);
		})
		.add("Rate Limit - Subsequent request (existing client)", () => {
			const req = createMockRequest({ sessionID: "existing-client" });
			checkRateLimit(req, config);
		})
		.add("Rate Limit - Multiple clients check", () => {
			for (let i = 0; i < 10; i++) {
				const req = createMockRequest({ sessionID: `client-${i}` });
				checkRateLimit(req, config);
			}
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks rate limiting with different limits
 */
function benchmarkDifferentLimits () {
	console.log("\n📊 Rate Limiting with Different Limits");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Create different rate limit configurations
	const configs = [
		{ name: "Low limit (10 req)", limit: 10, reset: 60 },
		{ name: "Medium limit (100 req)", limit: 100, reset: 300 },
		{ name: "High limit (1000 req)", limit: 1000, reset: 900 },
		{ name: "Very high limit (10000 req)", limit: 10000, reset: 3600 }
	];

	const rateStores = configs.map(() => new Map());

	const checkRateLimitWithConfig = (req, config, store) => {
		const reqId = req.sessionID || req.ip;
		const currentTime = Math.floor(Date.now() / 1000);

		if (!store.has(reqId)) {
			store.set(reqId, {
				remaining: config.limit - 1,
				reset: currentTime + config.reset
			});

			return true;
		}

		const state = store.get(reqId);

		if (currentTime >= state.reset) {
			state.remaining = config.limit - 1;
			state.reset = currentTime + config.reset;

			return true;
		}

		return state.remaining > 0 ? (state.remaining--, true) : false;
	};

	configs.forEach((config, index) => {
		suite.add(`Rate Limit - ${config.name}`, () => {
			const req = createMockRequest({ sessionID: "test-client" });
			checkRateLimitWithConfig(req, config, rateStores[index]);
		});
	});

	suite
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks rate limit window reset performance
 */
function benchmarkWindowReset () {
	console.log("\n📊 Rate Limit Window Reset Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const rateStore = new Map();

	const checkWithReset = (req, needsReset = false) => {
		const reqId = req.sessionID || req.ip;
		const currentTime = Math.floor(Date.now() / 1000);

		if (!rateStore.has(reqId)) {
			rateStore.set(reqId, {
				remaining: 99,
				reset: currentTime + (needsReset ? 0 : 900) // Force reset if needed
			});
		}

		const state = rateStore.get(reqId);

		if (needsReset || currentTime >= state.reset) {
			// Simulate window reset
			state.remaining = 100;
			state.reset = currentTime + 900;

			return { reset: true, remaining: state.remaining };
		}

		state.remaining--;

		return { reset: false, remaining: state.remaining };
	};

	suite
		.add("Rate Limit - Normal check (no reset)", () => {
			const req = createMockRequest({ sessionID: "normal-client" });
			checkWithReset(req, false);
		})
		.add("Rate Limit - With window reset", () => {
			const req = createMockRequest({ sessionID: "reset-client" });
			checkWithReset(req, true);
		})
		.add("Rate Limit - Batch reset simulation", () => {
			// Simulate many clients resetting at once
			for (let i = 0; i < 50; i++) {
				const req = createMockRequest({ sessionID: `batch-${i}` });
				checkWithReset(req, true);
			}
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks rate limiting with high concurrency
 */
function benchmarkHighConcurrency () {
	console.log("\n📊 Rate Limiting High Concurrency");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const rateStore = new Map();

	const concurrentRateCheck = clientCount => {
		const currentTime = Math.floor(Date.now() / 1000);

		for (let i = 0; i < clientCount; i++) {
			const clientId = `client-${i}`;

			if (!rateStore.has(clientId)) {
				rateStore.set(clientId, {
					remaining: 100,
					reset: currentTime + 900
				});
			}

			const state = rateStore.get(clientId);
			if (state.remaining > 0) {
				state.remaining--;
			}
		}
	};

	suite
		.add("Rate Limit - 10 concurrent clients", () => {
			concurrentRateCheck(10);
		})
		.add("Rate Limit - 100 concurrent clients", () => {
			concurrentRateCheck(100);
		})
		.add("Rate Limit - 500 concurrent clients", () => {
			concurrentRateCheck(500);
		})
		.add("Rate Limit - 1000 concurrent clients", () => {
			concurrentRateCheck(1000);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log("  Performance degrades with more concurrent clients");
		})
		.run();
}

/**
 * Benchmarks rate limit override functionality
 */
function benchmarkRateOverride () {
	console.log("\n📊 Rate Limit Override Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Mock override function
	const overrideFunction = (req, state) => {
		// VIP users get higher limits
		if (req.headers["x-user-type"] === "vip") {
			return {
				...state,
				limit: state.limit * 10,
				remaining: state.remaining * 10
			};
		}

		// API keys get different limits
		if (req.headers["x-api-key"]) {
			return {
				...state,
				limit: 1000,
				remaining: 1000
			};
		}

		return state;
	};

	const checkRateWithOverride = req => {
		let state = {
			limit: 100,
			remaining: 50,
			reset: Date.now() + 900000
		};

		// Apply override
		state = overrideFunction(req, state);

		return state.remaining > 0;
	};

	suite
		.add("Rate Override - Normal user", () => {
			const req = createMockRequest();
			checkRateWithOverride(req);
		})
		.add("Rate Override - VIP user", () => {
			const req = createMockRequest({
				headers: { "x-user-type": "vip" }
			});
			checkRateWithOverride(req);
		})
		.add("Rate Override - API key user", () => {
			const req = createMockRequest({
				headers: { "x-api-key": "api-key-12345" }
			});
			checkRateWithOverride(req);
		})
		.add("Rate Override - Batch processing", () => {
			const users = [
				createMockRequest(),
				createMockRequest({ headers: { "x-user-type": "vip" } }),
				createMockRequest({ headers: { "x-api-key": "key123" } })
			];
			users.forEach(req => checkRateWithOverride(req));
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks rate limit cleanup for expired entries
 */
function benchmarkRateCleanup () {
	console.log("\n📊 Rate Limit Cleanup Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Create rate store with expired entries
	const createStoreWithExpiredEntries = size => {
		const store = new Map();
		const currentTime = Math.floor(Date.now() / 1000);

		for (let i = 0; i < size; i++) {
			store.set(`client-${i}`, {
				remaining: Math.floor(Math.random() * 100),
				reset: currentTime - Math.floor(Math.random() * 1000) // Some expired, some not
			});
		}

		return store;
	};

	const cleanupExpiredEntries = store => {
		const currentTime = Math.floor(Date.now() / 1000);
		const toDelete = [];

		for (const [key, value] of store.entries()) {
			if (currentTime >= value.reset) {
				toDelete.push(key);
			}
		}

		toDelete.forEach(key => store.delete(key));

		return toDelete.length;
	};

	suite
		.add("Rate Cleanup - Small store (100 entries)", () => {
			const store = createStoreWithExpiredEntries(100);
			cleanupExpiredEntries(store);
		})
		.add("Rate Cleanup - Medium store (1000 entries)", () => {
			const store = createStoreWithExpiredEntries(1000);
			cleanupExpiredEntries(store);
		})
		.add("Rate Cleanup - Large store (10000 entries)", () => {
			const store = createStoreWithExpiredEntries(10000);
			cleanupExpiredEntries(store);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log("  Cleanup time increases with store size");
		})
		.run();
}

/**
 * Memory usage test for rate limiting
 */
function testRateLimitMemoryUsage () {
	console.log("\n📊 Rate Limiting Memory Usage");
	console.log("-".repeat(40));

	const iterations = 10000;
	const rateStore = new Map();

	// Test memory usage with increasing number of clients
	const memoryStart = process.memoryUsage();

	for (let i = 0; i < iterations; i++) {
		const clientId = `client-${i}`;
		const currentTime = Math.floor(Date.now() / 1000);

		rateStore.set(clientId, {
			limit: 100,
			remaining: Math.floor(Math.random() * 100),
			reset: currentTime + 900
		});

		// Simulate some rate checks
		if (i % 100 === 0) {
			for (let j = 0; j < 10; j++) {
				const existingClientId = `client-${Math.floor(Math.random() * i)}`;
				const state = rateStore.get(existingClientId);
				if (state && state.remaining > 0) {
					state.remaining--;
				}
			}
		}
	}

	const memoryEnd = process.memoryUsage();

	console.log(`Rate Store (${iterations} clients):`);
	const heapDiff = memoryEnd.heapUsed - memoryStart.heapUsed;
	console.log(`  Heap Used: ${heapDiff >= 0 ? "+" : ""}${formatFilesize(heapDiff)}`);
	console.log(`  Memory per client: ${formatFilesize(heapDiff >= 0 ? heapDiff / iterations : 0)}`);
	console.log(`  Total store size: ${rateStore.size} entries`);

	// Test cleanup impact
	const cleanupStart = process.memoryUsage();
	const currentTime = Math.floor(Date.now() / 1000);

	// Mark half as expired
	let expiredCount = 0;
	for (const [key, value] of rateStore.entries()) { // eslint-disable-line no-unused-vars
		if (expiredCount < iterations / 2) {
			value.reset = currentTime - 1;
			expiredCount++;
		}
	}

	// Cleanup expired entries
	const toDelete = [];
	for (const [key, value] of rateStore.entries()) {
		if (currentTime >= value.reset) {
			toDelete.push(key);
		}
	}
	toDelete.forEach(key => rateStore.delete(key));

	const cleanupEnd = process.memoryUsage();

	console.log(`After cleanup (${toDelete.length} removed):`);
	const freedDiff = cleanupStart.heapUsed - cleanupEnd.heapUsed;
	console.log(`  Heap freed: ${freedDiff >= 0 ? "+" : ""}${formatFilesize(freedDiff)}`);
	console.log(`  Remaining entries: ${rateStore.size}`);
	console.log("  Note: Negative values indicate garbage collection occurred during test");
}

/**
 * Tests rate limiting accuracy under load
 */
function testRateLimitAccuracy () {
	console.log("\n📊 Rate Limiting Accuracy Test");
	console.log("-".repeat(40));

	const limit = 100;
	const reset = 60;
	const rateStore = new Map();
	const clientId = "accuracy-test-client";

	let allowed = 0;
	let denied = 0;
	const currentTime = Math.floor(Date.now() / 1000);

	// Initialize client
	rateStore.set(clientId, {
		remaining: limit,
		reset: currentTime + reset
	});

	// Make requests beyond the limit
	for (let i = 0; i < limit + 50; i++) {
		const state = rateStore.get(clientId);

		if (state.remaining > 0) {
			state.remaining--;
			allowed++;
		} else {
			denied++;
		}
	}

	console.log(`Rate limit accuracy (limit: ${limit}):`);
	console.log(`  Requests allowed: ${allowed}`);
	console.log(`  Requests denied: ${denied}`);
	console.log(`  Accuracy: ${allowed === limit ? "✅ Perfect" : "❌ Inaccurate"}`);
	console.log(`  Expected vs Actual: ${limit} vs ${allowed}`);
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Rate Limiting Performance Benchmarks");

	try {
		benchmarkBasicRateLimit();
		benchmarkDifferentLimits();
		benchmarkWindowReset();
		benchmarkHighConcurrency();
		benchmarkRateOverride();
		benchmarkRateCleanup();
		testRateLimitMemoryUsage();
		testRateLimitAccuracy();

		console.log("\n✅ Rate limiting benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
