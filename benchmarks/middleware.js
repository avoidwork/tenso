/**
 * Tenso Middleware Performance Benchmark
 *
 * Tests the performance impact of different middleware configurations,
 * chain lengths, and middleware patterns.
 */

import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {tenso} from "../dist/tenso.js";

const require = createRequire(import.meta.url);
const http = require("http");

// Benchmark configuration
const BENCHMARK_CONFIG = {
	requests: 1500,
	concurrency: 12,
	warmupRequests: 150,
	port: 3003,
	host: "127.0.0.1"
};

/**
 * Middleware test scenarios
 */
const MIDDLEWARE_TESTS = {
	"no-middleware": {
		name: "No Middleware (Baseline)",
		description: "Baseline performance with no custom middleware",
		middlewares: [],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({message: "No middleware", timestamp: Date.now()});
			});
		}
	},
	"single-middleware": {
		name: "Single Middleware",
		description: "Performance with one lightweight middleware",
		middlewares: [
			(req, res, next) => {
				req.singleMiddleware = true;
				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Single middleware",
					middleware: req.singleMiddleware,
					timestamp: Date.now()
				});
			});
		}
	},
	"triple-middleware": {
		name: "Triple Middleware Chain",
		description: "Performance with three middleware functions",
		middlewares: [
			(req, res, next) => {
				req.middleware1 = performance.now();
				next();
			},
			(req, res, next) => {
				req.middleware2 = performance.now();
				next();
			},
			(req, res, next) => {
				req.middleware3 = performance.now();
				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Triple middleware",
					timings: {
						middleware1: req.middleware1,
						middleware2: req.middleware2,
						middleware3: req.middleware3
					},
					timestamp: Date.now()
				});
			});
		}
	},
	"heavy-middleware": {
		name: "Heavy Processing Middleware",
		description: "Performance with computationally intensive middleware",
		middlewares: [
			(req, res, next) => {
				// Simulate heavy computation
				let sum = 0;
				for (let i = 0; i < 10000; i++) {
					sum += Math.random() * i;
				}
				req.computationResult = sum;
				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Heavy middleware",
					computation: req.computationResult,
					timestamp: Date.now()
				});
			});
		}
	},
	"async-middleware": {
		name: "Async Middleware Chain",
		description: "Performance with asynchronous middleware operations",
		middlewares: [
			async (req, res, next) => {
				req.asyncStart = performance.now();
				await new Promise(resolve => setTimeout(resolve, 1));
				req.asyncResult1 = "async1";
				next();
			},
			async (req, res, next) => {
				await new Promise(resolve => setTimeout(resolve, 1));
				req.asyncResult2 = "async2";
				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Async middleware",
					asyncResults: {
						result1: req.asyncResult1,
						result2: req.asyncResult2,
						duration: performance.now() - req.asyncStart
					},
					timestamp: Date.now()
				});
			});
		}
	},
	"logging-middleware": {
		name: "Logging Middleware",
		description: "Performance impact of request logging middleware",
		middlewares: [
			(req, res, next) => {
				req.requestId = Math.random().toString(36).substr(2, 9);
				req.startTime = performance.now();

				// Simulate logging
				const logEntry = {
					requestId: req.requestId,
					method: req.method,
					url: req.url,
					timestamp: new Date().toISOString(),
					userAgent: req.headers["user-agent"] || "unknown"
				};

				// Simulate log writing (without actual I/O)
				const logString = JSON.stringify(logEntry);
				req.logSize = Buffer.byteLength(logString, "utf8");

				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				const endTime = performance.now();
				res.json({
					message: "Logging middleware",
					requestId: req.requestId,
					processingTime: endTime - req.startTime,
					logSize: req.logSize,
					timestamp: Date.now()
				});
			});
		}
	},
	"validation-middleware": {
		name: "Request Validation Middleware",
		description: "Performance impact of request validation",
		middlewares: [
			(req, res, next) => {
				const validationRules = {
					requiredHeaders: ["user-agent"],
					allowedMethods: ["GET", "POST", "PUT", "DELETE"],
					maxUrlLength: 1000
				};

				// Validate headers
				for (const header of validationRules.requiredHeaders) {
					if (!req.headers[header]) {
						req.validationErrors = req.validationErrors || [];
						req.validationErrors.push(`Missing header: ${header}`);
					}
				}

				// Validate method
				if (!validationRules.allowedMethods.includes(req.method)) {
					req.validationErrors = req.validationErrors || [];
					req.validationErrors.push(`Invalid method: ${req.method}`);
				}

				// Validate URL length
				if (req.url && req.url.length > validationRules.maxUrlLength) {
					req.validationErrors = req.validationErrors || [];
					req.validationErrors.push(`URL too long: ${req.url.length}`);
				}

				req.isValid = !req.validationErrors || req.validationErrors.length === 0;
				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Validation middleware",
					isValid: req.isValid,
					errors: req.validationErrors || [],
					timestamp: Date.now()
				});
			});
		}
	},
	"caching-middleware": {
		name: "Response Caching Middleware",
		description: "Performance impact of response caching logic",
		middlewares: [
			(req, res, next) => {
				const cache = new Map();
				const cacheKey = `${req.method}:${req.url}`;

				// Check cache
				if (cache.has(cacheKey)) {
					req.cacheHit = true;
					req.cachedData = cache.get(cacheKey);
				} else {
					req.cacheHit = false;

					// Simulate cache miss processing
					const data = {
						key: cacheKey,
						generated: Date.now(),
						data: Array.from({length: 10}, (_, i) => ({id: i, value: Math.random()}))
					};

					cache.set(cacheKey, data);
					req.cachedData = data;
				}

				next();
			}
		],
		setup: (app) => {
			app.get("/test", (req, res) => {
				res.json({
					message: "Caching middleware",
					cacheHit: req.cacheHit,
					data: req.cachedData,
					timestamp: Date.now()
				});
			});
		}
	},
	"ten-middleware-chain": {
		name: "Ten Middleware Chain",
		description: "Performance with ten lightweight middleware functions",
		middlewares: Array.from({length: 10}, (_, i) => (req, res, next) => {
			req[`middleware${i + 1}`] = {
				order: i + 1,
				timestamp: performance.now(),
				random: Math.random()
			};
			next();
		}),
		setup: (app) => {
			app.get("/test", (req, res) => {
				const middlewareData = {};
				for (let i = 1; i <= 10; i++) {
					middlewareData[`middleware${i}`] = req[`middleware${i}`];
				}

				res.json({
					message: "Ten middleware chain",
					middlewareData: middlewareData,
					timestamp: Date.now()
				});
			});
		}
	}
};

/**
 * HTTP request helper
 */
function makeRequest(path, config) {
	return new Promise((resolve, reject) => {
		const startTime = performance.now();
		const options = {
			hostname: config.host,
			port: config.port,
			path: path,
			method: "GET",
			headers: {
				"User-Agent": "Tenso-Middleware-Benchmark/1.0"
			}
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", chunk => data += chunk);
			res.on("end", () => {
				const endTime = performance.now();
				resolve({
					statusCode: res.statusCode,
					responseTime: endTime - startTime,
					size: Buffer.byteLength(data, "utf8"),
					data: data
				});
			});
		});

		req.on("error", reject);
		req.on("timeout", () => reject(new Error("Request timeout")));
		req.setTimeout(5000);
		req.end();
	});
}

/**
 * Runs a batch of concurrent requests
 */
async function runRequestBatch(config) {
	const promises = [];

	for (let i = 0; i < config.concurrency; i++) {
		promises.push(makeRequest("/test", config));
	}

	try {
		return await Promise.all(promises);
	} catch (error) {
		console.error("Batch error:", error.message);
		return [];
	}
}

/**
 * Runs middleware benchmark for a specific test scenario
 */
async function runMiddlewareBenchmark(testName, testConfig, config) {
	console.log(`\n┌─ ${testConfig.name}`);
	console.log(`│  ${testConfig.description}`);
	console.log(`│  Middleware count: ${testConfig.middlewares.length}`);
	console.log(`└─ Running ${config.requests} requests with ${config.concurrency} concurrent connections\n`);

	const results = [];

	// Warmup phase
	console.log(`  Warming up with ${config.warmupRequests} requests...`);
	for (let i = 0; i < config.warmupRequests; i += config.concurrency) {
		await runRequestBatch(config);
	}

	// Benchmark phase
	console.log("  Running benchmark...");
	const benchmarkStart = performance.now();

	for (let i = 0; i < config.requests; i += config.concurrency) {
		const batchResults = await runRequestBatch(config);
		results.push(...batchResults);
	}

	const benchmarkEnd = performance.now();
	const totalDuration = (benchmarkEnd - benchmarkStart) / 1000;

	// Calculate statistics
	const successfulRequests = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);
	const responseTimes = successfulRequests.map(r => r.responseTime);
	const responseSizes = successfulRequests.map(r => r.size);

	if (responseTimes.length === 0) {
		console.log("  ❌ No successful requests completed");
		return;
	}

	responseTimes.sort((a, b) => a - b);

	const stats = {
		requests: results.length,
		successful: successfulRequests.length,
		errors: results.length - successfulRequests.length,
		duration: totalDuration,
		requestsPerSecond: successfulRequests.length / totalDuration,
		avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
		minResponseTime: responseTimes[0],
		maxResponseTime: responseTimes[responseTimes.length - 1],
		p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
		p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
		p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
		avgResponseSize: responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length,
		throughputMBps: (responseSizes.reduce((a, b) => a + b, 0) / totalDuration) / (1024 * 1024),
		middlewareCount: testConfig.middlewares.length
	};

	// Display results
	console.log(`\n  Results:`);
	console.log(`    Requests: ${stats.requests.toLocaleString()}`);
	console.log(`    Successful: ${stats.successful.toLocaleString()}`);
	console.log(`    Errors: ${stats.errors}`);
	console.log(`    Duration: ${stats.duration.toFixed(2)}s`);
	console.log(`    Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);
	console.log(`    Throughput: ${stats.throughputMBps.toFixed(3)} MB/s`);
	console.log(`    Avg Response Size: ${Math.round(stats.avgResponseSize)} bytes`);

	console.log(`\n  Latency:`);
	console.log(`    Average: ${stats.avgResponseTime.toFixed(2)}ms`);
	console.log(`    Min: ${stats.minResponseTime.toFixed(2)}ms`);
	console.log(`    Max: ${stats.maxResponseTime.toFixed(2)}ms`);
	console.log(`    50th percentile: ${stats.p50.toFixed(2)}ms`);
	console.log(`    95th percentile: ${stats.p95.toFixed(2)}ms`);
	console.log(`    99th percentile: ${stats.p99.toFixed(2)}ms`);

	console.log(`\n  Middleware Impact:`);
	console.log(`    Middleware count: ${stats.middlewareCount}`);
	console.log(`    Avg time per middleware: ${stats.middlewareCount > 0 ? (stats.avgResponseTime / stats.middlewareCount).toFixed(2) : 0}ms`);

	return stats;
}

/**
 * Main middleware benchmark runner
 */
async function runMiddlewareBenchmarks() {
	console.log("⚙️  Tenso Middleware Performance Benchmark");
	console.log("==========================================\n");

	const allResults = {};
	const targetTest = process.argv[2];

	// Run specific test if provided
	if (targetTest && MIDDLEWARE_TESTS[targetTest]) {
		const testConfig = MIDDLEWARE_TESTS[targetTest];

		// Create and configure server
		const app = tenso({
			port: BENCHMARK_CONFIG.port,
			host: BENCHMARK_CONFIG.host,
			silent: true,
			logging: {enabled: false}
		});

		// Apply middleware
		for (const middleware of testConfig.middlewares) {
			app.always(middleware);
		}

		// Setup routes
		testConfig.setup(app);

		// Start server
		app.start();
		console.log(`Server started on ${BENCHMARK_CONFIG.host}:${BENCHMARK_CONFIG.port}`);
		await new Promise(resolve => setTimeout(resolve, 1000));

		try {
			allResults[targetTest] = await runMiddlewareBenchmark(targetTest, testConfig, BENCHMARK_CONFIG);
		} catch (error) {
			console.error("Benchmark error:", error);
		} finally {
			app.stop();
		}
	} else {
		// Run all tests
		for (const [testName, testConfig] of Object.entries(MIDDLEWARE_TESTS)) {
			// Create and configure server for each test
			const app = tenso({
				port: BENCHMARK_CONFIG.port,
				host: BENCHMARK_CONFIG.host,
				silent: true,
				logging: {enabled: false}
			});

			// Apply middleware
			for (const middleware of testConfig.middlewares) {
				app.always(middleware);
			}

			// Setup routes
			testConfig.setup(app);

			// Start server
			app.start();
			console.log(`Server started on ${BENCHMARK_CONFIG.host}:${BENCHMARK_CONFIG.port}`);
			await new Promise(resolve => setTimeout(resolve, 1000));

			try {
				allResults[testName] = await runMiddlewareBenchmark(testName, testConfig, BENCHMARK_CONFIG);
			} catch (error) {
				console.error(`Benchmark error for ${testName}:`, error);
			} finally {
				app.stop();
				// Small delay between tests
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}
	}

	// Summary
	console.log(`\n🏁 Middleware Benchmark Summary`);
	console.log("===============================");

	// Sort by performance (requests per second)
	const sortedResults = Object.entries(allResults)
		.filter(([_, stats]) => stats)
		.sort(([_, a], [__, b]) => b.requestsPerSecond - a.requestsPerSecond);

	console.log("\nRanked by Performance (req/s):");
	sortedResults.forEach(([testName, stats], index) => {
		const testConfig = MIDDLEWARE_TESTS[testName];
		console.log(`${index + 1}. ${testConfig.name}: ${stats.requestsPerSecond.toFixed(2)} req/s (${stats.middlewareCount} middleware)`);
	});

	// Performance impact analysis
	if (allResults["no-middleware"] && Object.keys(allResults).length > 1) {
		console.log("\nPerformance Impact Analysis:");
		const baseline = allResults["no-middleware"];

		Object.entries(allResults).forEach(([testName, stats]) => {
			if (testName !== "no-middleware" && stats) {
				const impact = ((baseline.requestsPerSecond - stats.requestsPerSecond) / baseline.requestsPerSecond) * 100;
				const latencyIncrease = ((stats.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100;

				console.log(`${MIDDLEWARE_TESTS[testName].name}:`);
				console.log(`  Performance decrease: ${impact.toFixed(1)}%`);
				console.log(`  Latency increase: ${latencyIncrease.toFixed(1)}%`);
				console.log(`  Cost per middleware: ${(impact / stats.middlewareCount).toFixed(1)}% per middleware`);
			}
		});
	}

	console.log("\nBenchmark completed!");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down benchmark...");
	process.exit(0);
});

// Run the benchmark
if (import.meta.url === `file://${process.argv[1]}`) {
	runMiddlewareBenchmarks().catch(console.error);
}
