/**
 * Tenso Content Negotiation Benchmark
 *
 * Tests performance of content type negotiation, serialization,
 * and rendering across different formats (JSON, XML, CSV, YAML, etc.)
 */

import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {tenso} from "../dist/tenso.js";

const require = createRequire(import.meta.url);
const http = require("http");

// Benchmark configuration
const BENCHMARK_CONFIG = {
	requests: 1200,
	concurrency: 10,
	warmupRequests: 120,
	port: 3004,
	host: "127.0.0.1"
};

/**
 * Test data for different serialization scenarios
 */
const TEST_DATA = {
	simple: {
		message: "Hello World",
		timestamp: new Date().toISOString(),
		status: "success"
	},
	complex: {
		users: Array.from({length: 50}, (_, i) => ({
			id: i + 1,
			name: `User ${i + 1}`,
			email: `user${i + 1}@example.com`,
			profile: {
				age: 20 + (i % 50),
				preferences: {
					theme: i % 2 === 0 ? "dark" : "light",
					notifications: i % 3 === 0,
					language: ["en", "es", "fr", "de"][i % 4]
				},
				tags: [`tag${i % 5}`, `category${i % 3}`]
			},
			metadata: {
				created: new Date(Date.now() - i * 86400000).toISOString(),
				lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString()
			}
		})),
		pagination: {
			total: 1000,
			page: 1,
			pageSize: 50,
			hasNext: true,
			hasPrev: false
		},
		meta: {
			version: "1.0.0",
			timestamp: new Date().toISOString(),
			apiEndpoint: "/api/users"
		}
	},
	nested: {
		organization: {
			id: 1,
			name: "ACME Corp",
			departments: Array.from({length: 10}, (_, i) => ({
				id: i + 1,
				name: `Department ${i + 1}`,
				employees: Array.from({length: 15}, (_, j) => ({
					id: j + 1,
					name: `Employee ${j + 1}`,
					position: ["Manager", "Developer", "Analyst", "Designer"][j % 4],
					projects: Array.from({length: 3}, (_, k) => ({
						id: k + 1,
						name: `Project ${k + 1}`,
						status: ["active", "completed", "pending"][k % 3],
						tasks: Array.from({length: 5}, (_, l) => ({
							id: l + 1,
							title: `Task ${l + 1}`,
							completed: l % 2 === 0
						}))
					}))
				}))
			}))
		}
	}
};

/**
 * Content negotiation test scenarios
 */
const CONTENT_TESTS = {
	"json-simple": {
		name: "JSON Simple Object",
		description: "Basic JSON serialization performance",
		data: TEST_DATA.simple,
		contentType: "application/json",
		endpoint: "/api/simple"
	},
	"json-complex": {
		name: "JSON Complex Object",
		description: "Complex JSON serialization with nested arrays",
		data: TEST_DATA.complex,
		contentType: "application/json",
		endpoint: "/api/complex"
	},
	"json-nested": {
		name: "JSON Deeply Nested",
		description: "Deeply nested JSON object serialization",
		data: TEST_DATA.nested,
		contentType: "application/json",
		endpoint: "/api/nested"
	},
	"xml-simple": {
		name: "XML Simple Object",
		description: "Basic XML serialization performance",
		data: TEST_DATA.simple,
		contentType: "application/xml",
		endpoint: "/api/simple"
	},
	"xml-complex": {
		name: "XML Complex Object",
		description: "Complex XML serialization with nested arrays",
		data: TEST_DATA.complex,
		contentType: "application/xml",
		endpoint: "/api/complex"
	},
	"yaml-simple": {
		name: "YAML Simple Object",
		description: "Basic YAML serialization performance",
		data: TEST_DATA.simple,
		contentType: "application/yaml",
		endpoint: "/api/simple"
	},
	"yaml-complex": {
		name: "YAML Complex Object",
		description: "Complex YAML serialization performance",
		data: TEST_DATA.complex,
		contentType: "application/yaml",
		endpoint: "/api/complex"
	},
	"csv-tabular": {
		name: "CSV Tabular Data",
		description: "CSV serialization of tabular data",
		data: TEST_DATA.complex.users.map(user => ({
			id: user.id,
			name: user.name,
			email: user.email,
			age: user.profile.age,
			theme: user.profile.preferences.theme,
			language: user.profile.preferences.language
		})),
		contentType: "text/csv",
		endpoint: "/api/users"
	},
	"plain-text": {
		name: "Plain Text",
		description: "Plain text serialization performance",
		data: TEST_DATA.simple,
		contentType: "text/plain",
		endpoint: "/api/simple"
	},
	"javascript-jsonp": {
		name: "JavaScript/JSONP",
		description: "JSONP callback serialization performance",
		data: TEST_DATA.simple,
		contentType: "application/javascript",
		endpoint: "/api/simple?callback=handleResponse"
	},
	"multiple-accept": {
		name: "Multiple Accept Headers",
		description: "Performance with multiple accept header negotiation",
		data: TEST_DATA.simple,
		contentType: "application/json, application/xml;q=0.9, text/plain;q=0.8",
		endpoint: "/api/simple"
	},
	"content-with-charset": {
		name: "Content Type with Charset",
		description: "Performance with charset specification",
		data: TEST_DATA.simple,
		contentType: "application/json; charset=utf-8",
		endpoint: "/api/simple"
	}
};

/**
 * HTTP request helper with content negotiation
 */
function makeRequest(testConfig, config) {
	return new Promise((resolve, reject) => {
		const startTime = performance.now();
		const options = {
			hostname: config.host,
			port: config.port,
			path: testConfig.endpoint,
			method: "GET",
			headers: {
				"Accept": testConfig.contentType,
				"User-Agent": "Tenso-Content-Benchmark/1.0"
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
					contentType: res.headers["content-type"],
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
 * Runs a batch of concurrent requests for content negotiation
 */
async function runContentBatch(testConfig, config) {
	const promises = [];

	for (let i = 0; i < config.concurrency; i++) {
		promises.push(makeRequest(testConfig, config));
	}

	try {
		return await Promise.all(promises);
	} catch (error) {
		console.error("Batch error:", error.message);
		return [];
	}
}

/**
 * Analyzes content type specific metrics
 */
function analyzeContentMetrics(results, testConfig) {
	const successfulRequests = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);

	if (successfulRequests.length === 0) {
		return null;
	}

	// Analyze content type consistency
	const contentTypes = [...new Set(successfulRequests.map(r => r.contentType))];
	const primaryContentType = contentTypes[0];

	// Analyze response sizes for compression efficiency
	const sizes = successfulRequests.map(r => r.size);
	const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
	const minSize = Math.min(...sizes);
	const maxSize = Math.max(...sizes);

	// Calculate serialization efficiency (rough estimate)
	const originalDataSize = Buffer.byteLength(JSON.stringify(testConfig.data), "utf8");
	const compressionRatio = avgSize / originalDataSize;

	return {
		contentTypes,
		primaryContentType,
		avgSize,
		minSize,
		maxSize,
		originalDataSize,
		compressionRatio,
		sizeVariance: sizes.length > 1 ? Math.sqrt(sizes.reduce((acc, size) => acc + Math.pow(size - avgSize, 2), 0) / sizes.length) : 0
	};
}

/**
 * Runs content negotiation benchmark for a specific test scenario
 */
async function runContentBenchmark(testName, testConfig, config) {
	console.log(`\n┌─ ${testConfig.name}`);
	console.log(`│  ${testConfig.description}`);
	console.log(`│  Content-Type: ${testConfig.contentType}`);
	console.log(`│  Endpoint: ${testConfig.endpoint}`);
	console.log(`└─ Running ${config.requests} requests with ${config.concurrency} concurrent connections\n`);

	const results = [];

	// Warmup phase
	console.log(`  Warming up with ${config.warmupRequests} requests...`);
	for (let i = 0; i < config.warmupRequests; i += config.concurrency) {
		await runContentBatch(testConfig, config);
	}

	// Benchmark phase
	console.log("  Running benchmark...");
	const benchmarkStart = performance.now();

	for (let i = 0; i < config.requests; i += config.concurrency) {
		const batchResults = await runContentBatch(testConfig, config);
		results.push(...batchResults);
	}

	const benchmarkEnd = performance.now();
	const totalDuration = (benchmarkEnd - benchmarkStart) / 1000;

	// Calculate basic statistics
	const successfulRequests = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);
	const responseTimes = successfulRequests.map(r => r.responseTime);

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
		p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
	};

	// Analyze content-specific metrics
	const contentMetrics = analyzeContentMetrics(successfulRequests, testConfig);

	// Display results
	console.log(`\n  Results:`);
	console.log(`    Requests: ${stats.requests.toLocaleString()}`);
	console.log(`    Successful: ${stats.successful.toLocaleString()}`);
	console.log(`    Errors: ${stats.errors}`);
	console.log(`    Duration: ${stats.duration.toFixed(2)}s`);
	console.log(`    Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);

	console.log(`\n  Latency:`);
	console.log(`    Average: ${stats.avgResponseTime.toFixed(2)}ms`);
	console.log(`    Min: ${stats.minResponseTime.toFixed(2)}ms`);
	console.log(`    Max: ${stats.maxResponseTime.toFixed(2)}ms`);
	console.log(`    50th percentile: ${stats.p50.toFixed(2)}ms`);
	console.log(`    95th percentile: ${stats.p95.toFixed(2)}ms`);
	console.log(`    99th percentile: ${stats.p99.toFixed(2)}ms`);

	if (contentMetrics) {
		console.log(`\n  Content Metrics:`);
		console.log(`    Content-Type(s): ${contentMetrics.contentTypes.join(", ")}`);
		console.log(`    Avg Response Size: ${Math.round(contentMetrics.avgSize)} bytes`);
		console.log(`    Size Range: ${contentMetrics.minSize}-${contentMetrics.maxSize} bytes`);
		console.log(`    Original Data Size: ${contentMetrics.originalDataSize} bytes`);
		console.log(`    Compression Ratio: ${contentMetrics.compressionRatio.toFixed(2)}x`);
		console.log(`    Throughput: ${((contentMetrics.avgSize * stats.requestsPerSecond) / (1024 * 1024)).toFixed(3)} MB/s`);

		if (contentMetrics.sizeVariance > 0) {
			console.log(`    Size Variance: ${Math.round(contentMetrics.sizeVariance)} bytes`);
		}
	}

	return {
		...stats,
		contentMetrics
	};
}

/**
 * Main content negotiation benchmark runner
 */
async function runContentNegotiationBenchmarks() {
	console.log("🎭 Tenso Content Negotiation Benchmark");
	console.log("======================================\n");

	// Create and configure server
	const app = tenso({
		port: BENCHMARK_CONFIG.port,
		host: BENCHMARK_CONFIG.host,
		silent: true,
		logging: {enabled: false}
	});

	// Setup test endpoints with different data
	app.get("/api/simple", (req, res) => {
		res.json(TEST_DATA.simple);
	});

	app.get("/api/complex", (req, res) => {
		res.json(TEST_DATA.complex);
	});

	app.get("/api/nested", (req, res) => {
		res.json(TEST_DATA.nested);
	});

	app.get("/api/users", (req, res) => {
		const userData = TEST_DATA.complex.users.map(user => ({
			id: user.id,
			name: user.name,
			email: user.email,
			age: user.profile.age,
			theme: user.profile.preferences.theme,
			language: user.profile.preferences.language
		}));
		res.json(userData);
	});

	// Start server
	app.start();
	console.log(`Server started on ${BENCHMARK_CONFIG.host}:${BENCHMARK_CONFIG.port}`);

	// Wait for server to be ready
	await new Promise(resolve => setTimeout(resolve, 1000));

	const allResults = {};

	try {
		// Run specific test if provided as command line argument
		const targetTest = process.argv[2];
		if (targetTest && CONTENT_TESTS[targetTest]) {
			allResults[targetTest] = await runContentBenchmark(
				targetTest,
				CONTENT_TESTS[targetTest],
				BENCHMARK_CONFIG
			);
		} else {
			// Run all tests
			for (const [testName, testConfig] of Object.entries(CONTENT_TESTS)) {
				allResults[testName] = await runContentBenchmark(testName, testConfig, BENCHMARK_CONFIG);
			}
		}

		// Summary and analysis
		console.log(`\n🏁 Content Negotiation Benchmark Summary`);
		console.log("=========================================");

		const validResults = Object.entries(allResults).filter(([_, stats]) => stats);

		// Performance ranking
		console.log("\nPerformance Ranking (by requests/sec):");
		validResults
			.sort(([_, a], [__, b]) => b.requestsPerSecond - a.requestsPerSecond)
			.forEach(([testName, stats], index) => {
				console.log(`${index + 1}. ${CONTENT_TESTS[testName].name}: ${stats.requestsPerSecond.toFixed(2)} req/s`);
			});

		// Size efficiency analysis
		console.log("\nResponse Size Analysis:");
		validResults
			.filter(([_, stats]) => stats.contentMetrics)
			.sort(([_, a], [__, b]) => a.contentMetrics.avgSize - b.contentMetrics.avgSize)
			.forEach(([testName, stats]) => {
				const metrics = stats.contentMetrics;
				console.log(`${CONTENT_TESTS[testName].name}: ${Math.round(metrics.avgSize)} bytes (${metrics.compressionRatio.toFixed(2)}x compression)`);
			});

		// Throughput analysis
		console.log("\nThroughput Analysis:");
		validResults
			.filter(([_, stats]) => stats.contentMetrics)
			.sort(([_, a], [__, b]) => {
				const throughputA = (a.contentMetrics.avgSize * a.requestsPerSecond) / (1024 * 1024);
				const throughputB = (b.contentMetrics.avgSize * b.requestsPerSecond) / (1024 * 1024);
				return throughputB - throughputA;
			})
			.forEach(([testName, stats]) => {
				const throughput = (stats.contentMetrics.avgSize * stats.requestsPerSecond) / (1024 * 1024);
				console.log(`${CONTENT_TESTS[testName].name}: ${throughput.toFixed(3)} MB/s`);
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
	runContentNegotiationBenchmarks().catch(console.error);
}
