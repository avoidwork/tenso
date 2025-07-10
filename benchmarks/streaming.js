/**
 * Tenso Streaming & Large Payload Benchmark
 *
 * Tests performance of streaming responses, large payload handling,
 * and memory efficiency with different data transfer patterns.
 */

import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {tenso} from "../dist/tenso.js";

const require = createRequire(import.meta.url);
const http = require("http");

// Benchmark configuration
const BENCHMARK_CONFIG = {
	requests: 500,
	concurrency: 8,
	warmupRequests: 50,
	port: 3005,
	host: "127.0.0.1"
};

/**
 * Data generation utilities
 */
class DataGenerator {
	/**
	 * Generates a large array of objects
	 */
	static generateLargeArray(size, complexity = "medium") {
		const templates = {
			simple: () => ({
				id: Math.floor(Math.random() * 1000000),
				value: Math.random(),
				timestamp: Date.now()
			}),
			medium: () => ({
				id: Math.floor(Math.random() * 1000000),
				name: `Item ${Math.floor(Math.random() * 10000)}`,
				description: "A test item with some description text that makes it more realistic",
				metadata: {
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					tags: ["tag1", "tag2", "tag3"],
					category: ["electronics", "books", "clothing", "home"][Math.floor(Math.random() * 4)]
				},
				metrics: {
					views: Math.floor(Math.random() * 10000),
					likes: Math.floor(Math.random() * 1000),
					rating: Math.random() * 5
				}
			}),
			complex: () => ({
				id: Math.floor(Math.random() * 1000000),
				name: `Complex Item ${Math.floor(Math.random() * 10000)}`,
				description: "A very detailed item with extensive metadata and nested properties",
				specifications: {
					dimensions: {
						width: Math.random() * 100,
						height: Math.random() * 100,
						depth: Math.random() * 100,
						weight: Math.random() * 10
					},
					features: Array.from({length: 10}, (_, i) => `Feature ${i + 1}`),
					compatibility: Array.from({length: 5}, (_, i) => `Compatible with System ${i + 1}`)
				},
				pricing: {
					basePrice: Math.random() * 1000,
					discounts: Array.from({length: 3}, () => ({
						type: ["percentage", "fixed"][Math.floor(Math.random() * 2)],
						value: Math.random() * 50,
						validUntil: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
					}))
				},
				reviews: Array.from({length: 20}, () => ({
					userId: Math.floor(Math.random() * 10000),
					rating: Math.floor(Math.random() * 5) + 1,
					comment: "This is a sample review comment with some text content",
					date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
					helpful: Math.floor(Math.random() * 100)
				}))
			})
		};

		return Array.from({length: size}, templates[complexity]);
	}

	/**
	 * Generates a large string
	 */
	static generateLargeString(sizeKB) {
		const chunk = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
		const chunkSize = Buffer.byteLength(chunk, "utf8");
		const targetSize = sizeKB * 1024;
		const repetitions = Math.ceil(targetSize / chunkSize);

		return chunk.repeat(repetitions).substring(0, targetSize);
	}

	/**
	 * Generates binary-like data as base64
	 */
	static generateBinaryData(sizeKB) {
		const buffer = Buffer.alloc(sizeKB * 1024);
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = Math.floor(Math.random() * 256);
		}
		return buffer.toString("base64");
	}
}

/**
 * Streaming test scenarios
 */
const STREAMING_TESTS = {
	"small-array": {
		name: "Small Array (100 items)",
		description: "Performance with small data arrays",
		dataSize: "small",
		setup: (app) => {
			app.get("/api/small", (req, res) => {
				const data = DataGenerator.generateLargeArray(100, "simple");
				res.json({
					items: data,
					count: data.length,
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/small"
	},
	"medium-array": {
		name: "Medium Array (1K items)",
		description: "Performance with medium-sized data arrays",
		dataSize: "medium",
		setup: (app) => {
			app.get("/api/medium", (req, res) => {
				const data = DataGenerator.generateLargeArray(1000, "medium");
				res.json({
					items: data,
					count: data.length,
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/medium"
	},
	"large-array": {
		name: "Large Array (5K items)",
		description: "Performance with large data arrays",
		dataSize: "large",
		setup: (app) => {
			app.get("/api/large", (req, res) => {
				const data = DataGenerator.generateLargeArray(5000, "medium");
				res.json({
					items: data,
					count: data.length,
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/large"
	},
	"extra-large-array": {
		name: "Extra Large Array (10K items)",
		description: "Performance with extra large data arrays",
		dataSize: "xlarge",
		setup: (app) => {
			app.get("/api/xlarge", (req, res) => {
				const data = DataGenerator.generateLargeArray(10000, "complex");
				res.json({
					items: data,
					count: data.length,
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/xlarge"
	},
	"large-string": {
		name: "Large String Response (1MB)",
		description: "Performance with large string responses",
		dataSize: "string",
		setup: (app) => {
			app.get("/api/string", (req, res) => {
				const content = DataGenerator.generateLargeString(1024); // 1MB
				res.json({
					content: content,
					size: Buffer.byteLength(content, "utf8"),
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/string"
	},
	"binary-data": {
		name: "Binary Data (500KB base64)",
		description: "Performance with binary data encoded as base64",
		dataSize: "binary",
		setup: (app) => {
			app.get("/api/binary", (req, res) => {
				const binaryData = DataGenerator.generateBinaryData(500); // 500KB
				res.json({
					data: binaryData,
					encoding: "base64",
					originalSize: 500 * 1024,
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/binary"
	},
	"paginated-data": {
		name: "Paginated Data Response",
		description: "Performance with paginated large datasets",
		dataSize: "paginated",
		setup: (app) => {
			app.get("/api/paginated", (req, res) => {
				const page = parseInt(req.parsed.searchParams.get("page")) || 1;
				const pageSize = parseInt(req.parsed.searchParams.get("pageSize")) || 100;
				const totalItems = 10000;

				const startIndex = (page - 1) * pageSize;
				const endIndex = Math.min(startIndex + pageSize, totalItems);

				const data = DataGenerator.generateLargeArray(pageSize, "medium");

				res.json({
					items: data,
					pagination: {
						page: page,
						pageSize: pageSize,
						totalItems: totalItems,
						totalPages: Math.ceil(totalItems / pageSize),
						hasNext: endIndex < totalItems,
						hasPrev: page > 1
					},
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/paginated?page=1&pageSize=500"
	},
	"nested-deep": {
		name: "Deeply Nested Objects",
		description: "Performance with deeply nested object structures",
		dataSize: "nested",
		setup: (app) => {
			app.get("/api/nested", (req, res) => {
				const createNestedObject = (depth, currentDepth = 0) => {
					if (currentDepth >= depth) {
						return {
							value: Math.random(),
							id: currentDepth,
							data: Array.from({length: 10}, (_, i) => `item-${i}`)
						};
					}

					return {
						level: currentDepth,
						children: Array.from({length: 3}, (_, i) =>
							createNestedObject(depth, currentDepth + 1)
						),
						metadata: {
							created: new Date().toISOString(),
							index: currentDepth
						}
					};
				};

				const nestedData = createNestedObject(8); // 8 levels deep
				res.json({
					data: nestedData,
					structure: "8 levels deep",
					timestamp: new Date().toISOString()
				});
			});
		},
		endpoint: "/api/nested"
	}
};

/**
 * Memory monitoring during requests
 */
class MemoryMonitor {
	constructor() {
		this.samples = [];
		this.isMonitoring = false;
	}

	start() {
		this.isMonitoring = true;
		this.samples = [];
		this.intervalId = setInterval(() => {
			if (this.isMonitoring) {
				const memUsage = process.memoryUsage();
				this.samples.push({
					timestamp: Date.now(),
					...memUsage
				});
			}
		}, 100); // Sample every 100ms
	}

	stop() {
		this.isMonitoring = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	}

	getStats() {
		if (this.samples.length === 0) return null;

		const heapUsed = this.samples.map(s => s.heapUsed);
		const rss = this.samples.map(s => s.rss);

		return {
			samples: this.samples.length,
			heapUsed: {
				min: Math.min(...heapUsed) / 1024 / 1024,
				max: Math.max(...heapUsed) / 1024 / 1024,
				avg: heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length / 1024 / 1024,
				growth: (heapUsed[heapUsed.length - 1] - heapUsed[0]) / 1024 / 1024
			},
			rss: {
				min: Math.min(...rss) / 1024 / 1024,
				max: Math.max(...rss) / 1024 / 1024,
				avg: rss.reduce((a, b) => a + b, 0) / rss.length / 1024 / 1024,
				growth: (rss[rss.length - 1] - rss[0]) / 1024 / 1024
			}
		};
	}
}

/**
 * HTTP request helper with streaming support
 */
function makeStreamingRequest(endpoint, config) {
	return new Promise((resolve, reject) => {
		const startTime = performance.now();
		let firstByteTime = null;
		let totalBytes = 0;

		const options = {
			hostname: config.host,
			port: config.port,
			path: endpoint,
			method: "GET",
			headers: {
				"Accept": "application/json",
				"User-Agent": "Tenso-Streaming-Benchmark/1.0"
			}
		};

		const req = http.request(options, (res) => {
			let data = "";

			res.on("data", chunk => {
				if (firstByteTime === null) {
					firstByteTime = performance.now();
				}
				totalBytes += chunk.length;
				data += chunk;
			});

			res.on("end", () => {
				const endTime = performance.now();
				resolve({
					statusCode: res.statusCode,
					totalTime: endTime - startTime,
					firstByteTime: firstByteTime ? firstByteTime - startTime : null,
					downloadTime: firstByteTime ? endTime - firstByteTime : endTime - startTime,
					size: totalBytes,
					contentType: res.headers["content-type"],
					transferEncoding: res.headers["transfer-encoding"]
				});
			});
		});

		req.on("error", reject);
		req.on("timeout", () => reject(new Error("Request timeout")));
		req.setTimeout(30000); // 30 second timeout for large responses
		req.end();
	});
}

/**
 * Runs streaming benchmark for a specific test scenario
 */
async function runStreamingBenchmark(testName, testConfig, config) {
	console.log(`\n┌─ ${testConfig.name}`);
	console.log(`│  ${testConfig.description}`);
	console.log(`│  Data size: ${testConfig.dataSize}`);
	console.log(`│  Endpoint: ${testConfig.endpoint}`);
	console.log(`└─ Running ${config.requests} requests with ${config.concurrency} concurrent connections\n`);

	const results = [];
	const memoryMonitor = new MemoryMonitor();

	// Warmup phase
	console.log(`  Warming up with ${config.warmupRequests} requests...`);
	for (let i = 0; i < config.warmupRequests; i += config.concurrency) {
		const promises = [];
		for (let j = 0; j < Math.min(config.concurrency, config.warmupRequests - i); j++) {
			promises.push(makeStreamingRequest(testConfig.endpoint, config));
		}
		await Promise.all(promises);
	}

	// Benchmark phase with memory monitoring
	console.log("  Running benchmark with memory monitoring...");
	memoryMonitor.start();
	const benchmarkStart = performance.now();

	for (let i = 0; i < config.requests; i += config.concurrency) {
		const promises = [];
		for (let j = 0; j < Math.min(config.concurrency, config.requests - i); j++) {
			promises.push(makeStreamingRequest(testConfig.endpoint, config));
		}

		try {
			const batchResults = await Promise.all(promises);
			results.push(...batchResults);
		} catch (error) {
			console.error("Batch error:", error.message);
		}
	}

	const benchmarkEnd = performance.now();
	memoryMonitor.stop();
	const totalDuration = (benchmarkEnd - benchmarkStart) / 1000;

	// Calculate statistics
	const successfulRequests = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);

	if (successfulRequests.length === 0) {
		console.log("  ❌ No successful requests completed");
		return;
	}

	const totalTimes = successfulRequests.map(r => r.totalTime);
	const firstByteTimes = successfulRequests.filter(r => r.firstByteTime).map(r => r.firstByteTime);
	const downloadTimes = successfulRequests.map(r => r.downloadTime);
	const sizes = successfulRequests.map(r => r.size);

	totalTimes.sort((a, b) => a - b);
	firstByteTimes.sort((a, b) => a - b);
	downloadTimes.sort((a, b) => a - b);

	const stats = {
		requests: results.length,
		successful: successfulRequests.length,
		errors: results.length - successfulRequests.length,
		duration: totalDuration,
		requestsPerSecond: successfulRequests.length / totalDuration,

		// Timing metrics
		avgTotalTime: totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length,
		avgFirstByteTime: firstByteTimes.length > 0 ? firstByteTimes.reduce((a, b) => a + b, 0) / firstByteTimes.length : 0,
		avgDownloadTime: downloadTimes.reduce((a, b) => a + b, 0) / downloadTimes.length,

		// Percentiles
		p50TotalTime: totalTimes[Math.floor(totalTimes.length * 0.5)],
		p95TotalTime: totalTimes[Math.floor(totalTimes.length * 0.95)],
		p99TotalTime: totalTimes[Math.floor(totalTimes.length * 0.99)],

		// Size metrics
		avgResponseSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
		minResponseSize: Math.min(...sizes),
		maxResponseSize: Math.max(...sizes),
		totalDataTransferred: sizes.reduce((a, b) => a + b, 0),

		// Throughput
		throughputMBps: (sizes.reduce((a, b) => a + b, 0) / totalDuration) / (1024 * 1024)
	};

	// Memory statistics
	const memoryStats = memoryMonitor.getStats();

	// Display results
	console.log(`\n  Results:`);
	console.log(`    Requests: ${stats.requests.toLocaleString()}`);
	console.log(`    Successful: ${stats.successful.toLocaleString()}`);
	console.log(`    Errors: ${stats.errors}`);
	console.log(`    Duration: ${stats.duration.toFixed(2)}s`);
	console.log(`    Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);

	console.log(`\n  Timing Breakdown:`);
	console.log(`    Avg Total Time: ${stats.avgTotalTime.toFixed(2)}ms`);
	if (stats.avgFirstByteTime > 0) {
		console.log(`    Avg First Byte Time: ${stats.avgFirstByteTime.toFixed(2)}ms`);
	}
	console.log(`    Avg Download Time: ${stats.avgDownloadTime.toFixed(2)}ms`);
	console.log(`    50th percentile: ${stats.p50TotalTime.toFixed(2)}ms`);
	console.log(`    95th percentile: ${stats.p95TotalTime.toFixed(2)}ms`);
	console.log(`    99th percentile: ${stats.p99TotalTime.toFixed(2)}ms`);

	console.log(`\n  Data Transfer:`);
	console.log(`    Avg Response Size: ${(stats.avgResponseSize / 1024).toFixed(1)} KB`);
	console.log(`    Size Range: ${(stats.minResponseSize / 1024).toFixed(1)}-${(stats.maxResponseSize / 1024).toFixed(1)} KB`);
	console.log(`    Total Data Transferred: ${(stats.totalDataTransferred / 1024 / 1024).toFixed(2)} MB`);
	console.log(`    Throughput: ${stats.throughputMBps.toFixed(3)} MB/s`);

	if (memoryStats) {
		console.log(`\n  Memory Usage:`);
		console.log(`    Heap Used - Min: ${memoryStats.heapUsed.min.toFixed(1)} MB, Max: ${memoryStats.heapUsed.max.toFixed(1)} MB, Avg: ${memoryStats.heapUsed.avg.toFixed(1)} MB`);
		console.log(`    RSS - Min: ${memoryStats.rss.min.toFixed(1)} MB, Max: ${memoryStats.rss.max.toFixed(1)} MB, Avg: ${memoryStats.rss.avg.toFixed(1)} MB`);
		console.log(`    Heap Growth: ${memoryStats.heapUsed.growth.toFixed(2)} MB`);
		console.log(`    RSS Growth: ${memoryStats.rss.growth.toFixed(2)} MB`);
		console.log(`    Memory Samples: ${memoryStats.samples}`);
	}

	return {
		...stats,
		memoryStats
	};
}

/**
 * Main streaming benchmark runner
 */
async function runStreamingBenchmarks() {
	console.log("🌊 Tenso Streaming & Large Payload Benchmark");
	console.log("============================================\n");

	// Create and configure server
	const app = tenso({
		port: BENCHMARK_CONFIG.port,
		host: BENCHMARK_CONFIG.host,
		silent: true,
		logging: {enabled: false}
	});

	// Setup all test endpoints
	for (const [testName, testConfig] of Object.entries(STREAMING_TESTS)) {
		testConfig.setup(app);
	}

	// Start server
	app.start();
	console.log(`Server started on ${BENCHMARK_CONFIG.host}:${BENCHMARK_CONFIG.port}`);

	// Wait for server to be ready
	await new Promise(resolve => setTimeout(resolve, 1000));

	const allResults = {};

	try {
		// Run specific test if provided as command line argument
		const targetTest = process.argv[2];
		if (targetTest && STREAMING_TESTS[targetTest]) {
			allResults[targetTest] = await runStreamingBenchmark(
				targetTest,
				STREAMING_TESTS[targetTest],
				BENCHMARK_CONFIG
			);
		} else {
			// Run all tests
			for (const [testName, testConfig] of Object.entries(STREAMING_TESTS)) {
				allResults[testName] = await runStreamingBenchmark(testName, testConfig, BENCHMARK_CONFIG);
				// Small delay between tests
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		// Summary and analysis
		console.log(`\n🏁 Streaming Benchmark Summary`);
		console.log("==============================");

		const validResults = Object.entries(allResults).filter(([_, stats]) => stats);

		// Performance ranking by throughput
		console.log("\nThroughput Ranking (MB/s):");
		validResults
			.sort(([_, a], [__, b]) => b.throughputMBps - a.throughputMBps)
			.forEach(([testName, stats], index) => {
				console.log(`${index + 1}. ${STREAMING_TESTS[testName].name}: ${stats.throughputMBps.toFixed(3)} MB/s`);
			});

		// Response size analysis
		console.log("\nResponse Size Analysis:");
		validResults
			.sort(([_, a], [__, b]) => a.avgResponseSize - b.avgResponseSize)
			.forEach(([testName, stats]) => {
				console.log(`${STREAMING_TESTS[testName].name}: ${(stats.avgResponseSize / 1024).toFixed(1)} KB avg`);
			});

		// Memory efficiency analysis
		console.log("\nMemory Efficiency:");
		validResults
			.filter(([_, stats]) => stats.memoryStats)
			.forEach(([testName, stats]) => {
				const memStats = stats.memoryStats;
				const efficiency = stats.avgResponseSize / (memStats.heapUsed.avg * 1024 * 1024);
				console.log(`${STREAMING_TESTS[testName].name}: ${efficiency.toFixed(3)} bytes/MB heap (${memStats.heapUsed.growth >= 0 ? '+' : ''}${memStats.heapUsed.growth.toFixed(2)} MB growth)`);
			});

	} catch (error) {
		console.error("Benchmark error:", error);
	} finally {
		app.stop();
		console.log("\nBenchmark completed!");
	}
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down benchmark...");
	process.exit(0);
});

// Run the benchmark
if (import.meta.url === `file://${process.argv[1]}`) {
	runStreamingBenchmarks().catch(console.error);
}
