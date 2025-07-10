/**
 * Tenso Concurrency Benchmark
 *
 * Tests performance under different concurrency levels and load patterns,
 * measuring how well Tenso handles concurrent connections and scaling.
 */

import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {tenso} from "../dist/tenso.js";

const require = createRequire(import.meta.url);
const http = require("http");

// Benchmark configuration
const BENCHMARK_CONFIG = {
	baseRequests: 1000,
	warmupRequests: 100,
	port: 3006,
	host: "127.0.0.1",
	timeout: 10000
};

/**
 * Concurrency test scenarios
 */
const CONCURRENCY_TESTS = {
	"low-concurrency": {
		name: "Low Concurrency (5 connections)",
		description: "Performance with low concurrent load",
		concurrency: 5,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "steady"
	},
	"medium-concurrency": {
		name: "Medium Concurrency (25 connections)",
		description: "Performance with medium concurrent load",
		concurrency: 25,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "steady"
	},
	"high-concurrency": {
		name: "High Concurrency (100 connections)",
		description: "Performance with high concurrent load",
		concurrency: 100,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "steady"
	},
	"extreme-concurrency": {
		name: "Extreme Concurrency (500 connections)",
		description: "Performance under extreme concurrent load",
		concurrency: 500,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "steady"
	},
	"burst-load": {
		name: "Burst Load Pattern",
		description: "Performance with sudden burst of requests",
		concurrency: 200,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "burst"
	},
	"ramp-up": {
		name: "Ramp-up Load Pattern",
		description: "Performance with gradually increasing load",
		concurrency: 150,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "ramp"
	},
	"sustained-load": {
		name: "Sustained High Load",
		description: "Performance under sustained high load",
		concurrency: 75,
		requests: BENCHMARK_CONFIG.baseRequests * 2,
		pattern: "sustained"
	},
	"spike-load": {
		name: "Spike Load Pattern",
		description: "Performance with intermittent load spikes",
		concurrency: 300,
		requests: BENCHMARK_CONFIG.baseRequests,
		pattern: "spike"
	}
};

/**
 * Load pattern implementations
 */
class LoadPatterns {
	/**
	 * Steady load pattern - consistent concurrent requests
	 */
	static async steady(testConfig, makeRequest) {
		const results = [];
		const batchSize = testConfig.concurrency;
		const totalBatches = Math.ceil(testConfig.requests / batchSize);

		for (let batch = 0; batch < totalBatches; batch++) {
			const promises = [];
			const requestsInBatch = Math.min(batchSize, testConfig.requests - (batch * batchSize));

			for (let i = 0; i < requestsInBatch; i++) {
				promises.push(makeRequest());
			}

			try {
				const batchResults = await Promise.all(promises);
				results.push(...batchResults);
			} catch (error) {
				console.error(`Batch ${batch} error:`, error.message);
			}
		}

		return results;
	}

	/**
	 * Burst load pattern - sudden bursts of high concurrency
	 */
	static async burst(testConfig, makeRequest) {
		const results = [];
		const burstSize = Math.floor(testConfig.concurrency * 1.5);
		const quietPeriod = 500; // ms between bursts
		const burstsNeeded = Math.ceil(testConfig.requests / burstSize);

		for (let burst = 0; burst < burstsNeeded; burst++) {
			const promises = [];
			const requestsInBurst = Math.min(burstSize, testConfig.requests - (burst * burstSize));

			// Create burst of requests
			for (let i = 0; i < requestsInBurst; i++) {
				promises.push(makeRequest());
			}

			try {
				const burstResults = await Promise.all(promises);
				results.push(...burstResults);
			} catch (error) {
				console.error(`Burst ${burst} error:`, error.message);
			}

			// Wait between bursts (except for the last one)
			if (burst < burstsNeeded - 1) {
				await new Promise(resolve => setTimeout(resolve, quietPeriod));
			}
		}

		return results;
	}

	/**
	 * Ramp-up load pattern - gradually increasing concurrency
	 */
	static async ramp(testConfig, makeRequest) {
		const results = [];
		const phases = 5;
		const requestsPerPhase = Math.floor(testConfig.requests / phases);

		for (let phase = 0; phase < phases; phase++) {
			const concurrency = Math.floor((phase + 1) * (testConfig.concurrency / phases));
			const promises = [];

			for (let i = 0; i < requestsPerPhase && (phase * requestsPerPhase + i) < testConfig.requests; i++) {
				promises.push(makeRequest());

				// Stagger requests within phase
				if (i > 0 && i % concurrency === 0) {
					await new Promise(resolve => setTimeout(resolve, 50));
				}
			}

			try {
				const phaseResults = await Promise.all(promises);
				results.push(...phaseResults);
			} catch (error) {
				console.error(`Phase ${phase} error:`, error.message);
			}
		}

		return results;
	}

	/**
	 * Sustained load pattern - consistent high load for extended period
	 */
	static async sustained(testConfig, makeRequest) {
		const results = [];
		const batchSize = testConfig.concurrency;
		const totalBatches = Math.ceil(testConfig.requests / batchSize);
		const batchDelay = 100; // Small delay between batches to sustain load

		for (let batch = 0; batch < totalBatches; batch++) {
			const promises = [];
			const requestsInBatch = Math.min(batchSize, testConfig.requests - (batch * batchSize));

			for (let i = 0; i < requestsInBatch; i++) {
				promises.push(makeRequest());
			}

			try {
				const batchResults = await Promise.all(promises);
				results.push(...batchResults);
			} catch (error) {
				console.error(`Sustained batch ${batch} error:`, error.message);
			}

			// Small delay to maintain sustained pressure
			if (batch < totalBatches - 1) {
				await new Promise(resolve => setTimeout(resolve, batchDelay));
			}
		}

		return results;
	}

	/**
	 * Spike load pattern - intermittent high spikes
	 */
	static async spike(testConfig, makeRequest) {
		const results = [];
		const spikes = 4;
		const requestsPerSpike = Math.floor(testConfig.requests / spikes);
		const restPeriod = 1000; // ms between spikes

		for (let spike = 0; spike < spikes; spike++) {
			const promises = [];

			// Create spike of concurrent requests
			for (let i = 0; i < requestsPerSpike && (spike * requestsPerSpike + i) < testConfig.requests; i++) {
				promises.push(makeRequest());
			}

			try {
				const spikeResults = await Promise.all(promises);
				results.push(...spikeResults);
			} catch (error) {
				console.error(`Spike ${spike} error:`, error.message);
			}

			// Rest period between spikes
			if (spike < spikes - 1) {
				await new Promise(resolve => setTimeout(resolve, restPeriod));
			}
		}

		return results;
	}
}

/**
 * Connection pool manager for tracking active connections
 */
class ConnectionManager {
	constructor() {
		this.activeConnections = 0;
		this.maxConnections = 0;
		this.connectionTimes = [];
	}

	startConnection() {
		this.activeConnections++;
		this.maxConnections = Math.max(this.maxConnections, this.activeConnections);
		const startTime = performance.now();
		return () => {
			this.activeConnections--;
			this.connectionTimes.push(performance.now() - startTime);
		};
	}

	getStats() {
		return {
			maxConcurrent: this.maxConnections,
			avgConnectionTime: this.connectionTimes.length > 0
				? this.connectionTimes.reduce((a, b) => a + b, 0) / this.connectionTimes.length
				: 0,
			totalConnections: this.connectionTimes.length
		};
	}

	reset() {
		this.activeConnections = 0;
		this.maxConnections = 0;
		this.connectionTimes = [];
	}
}

/**
 * HTTP request helper with connection tracking
 */
function makeTrackedRequest(config, connectionManager) {
	return new Promise((resolve, reject) => {
		const startTime = performance.now();
		const endConnection = connectionManager.startConnection();

		const options = {
			hostname: config.host,
			port: config.port,
			path: "/api/test",
			method: "GET",
			headers: {
				"Accept": "application/json",
				"User-Agent": "Tenso-Concurrency-Benchmark/1.0",
				"Connection": "keep-alive"
			}
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", chunk => data += chunk);
			res.on("end", () => {
				const endTime = performance.now();
				endConnection();
				resolve({
					statusCode: res.statusCode,
					responseTime: endTime - startTime,
					size: Buffer.byteLength(data, "utf8"),
					timestamp: endTime
				});
			});
		});

		req.on("error", (error) => {
			endConnection();
			reject(error);
		});

		req.on("timeout", () => {
			endConnection();
			reject(new Error("Request timeout"));
		});

		req.setTimeout(config.timeout);
		req.end();
	});
}

/**
 * Runs concurrency benchmark for a specific test scenario
 */
async function runConcurrencyBenchmark(testName, testConfig, config) {
	console.log(`\n┌─ ${testConfig.name}`);
	console.log(`│  ${testConfig.description}`);
	console.log(`│  Concurrency: ${testConfig.concurrency}`);
	console.log(`│  Pattern: ${testConfig.pattern}`);
	console.log(`│  Requests: ${testConfig.requests}`);
	console.log(`└─ Running benchmark...\n`);

	const connectionManager = new ConnectionManager();

	// Create request function bound to this test
	const makeRequest = () => makeTrackedRequest(config, connectionManager);

	// Warmup phase
	console.log(`  Warming up with ${BENCHMARK_CONFIG.warmupRequests} requests...`);
	const warmupPromises = [];
	for (let i = 0; i < BENCHMARK_CONFIG.warmupRequests; i++) {
		warmupPromises.push(makeRequest());
	}
	await Promise.all(warmupPromises);

	// Reset connection manager after warmup
	connectionManager.reset();

	// Benchmark phase
	console.log("  Running benchmark...");
	const benchmarkStart = performance.now();

	// Execute load pattern
	const loadPattern = LoadPatterns[testConfig.pattern] || LoadPatterns.steady;
	const results = await loadPattern(testConfig, makeRequest);

	const benchmarkEnd = performance.now();
	const totalDuration = (benchmarkEnd - benchmarkStart) / 1000;

	// Calculate statistics
	const successfulRequests = results.filter(r => r.statusCode >= 200 && r.statusCode < 400);
	const responseTimes = successfulRequests.map(r => r.responseTime);
	const connectionStats = connectionManager.getStats();

	if (responseTimes.length === 0) {
		console.log("  ❌ No successful requests completed");
		return;
	}

	responseTimes.sort((a, b) => a - b);

	// Calculate response time distribution
	const timeDistribution = {
		under50ms: responseTimes.filter(t => t < 50).length,
		under100ms: responseTimes.filter(t => t < 100).length,
		under500ms: responseTimes.filter(t => t < 500).length,
		under1s: responseTimes.filter(t => t < 1000).length,
		over1s: responseTimes.filter(t => t >= 1000).length
	};

	// Calculate average response time first
	const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
	
	const stats = {
		requests: results.length,
		successful: successfulRequests.length,
		errors: results.length - successfulRequests.length,
		errorRate: ((results.length - successfulRequests.length) / results.length) * 100,
		duration: totalDuration,
		requestsPerSecond: successfulRequests.length / totalDuration,

		// Response time statistics
		avgResponseTime: avgResponseTime,
		minResponseTime: responseTimes[0],
		maxResponseTime: responseTimes[responseTimes.length - 1],
		p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
		p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
		p99: responseTimes[Math.floor(responseTimes.length * 0.99)],

		// Concurrency statistics
		maxConcurrentConnections: connectionStats.maxConcurrent,
		avgConnectionTime: connectionStats.avgConnectionTime,
		totalConnections: connectionStats.totalConnections,

		// Distribution
		timeDistribution,

		// Efficiency metrics
		concurrencyEfficiency: testConfig.concurrency > 0 ? (successfulRequests.length / totalDuration) / testConfig.concurrency : 0,
		responseTimeVariability: responseTimes.length > 1 ? Math.sqrt(responseTimes.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length) : 0
	};

	// Display results
	console.log(`\n  Results:`);
	console.log(`    Requests: ${stats.requests.toLocaleString()}`);
	console.log(`    Successful: ${stats.successful.toLocaleString()}`);
	console.log(`    Errors: ${stats.errors} (${stats.errorRate.toFixed(1)}%)`);
	console.log(`    Duration: ${stats.duration.toFixed(2)}s`);
	console.log(`    Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);

	console.log(`\n  Response Times:`);
	console.log(`    Average: ${stats.avgResponseTime.toFixed(2)}ms`);
	console.log(`    Min: ${stats.minResponseTime.toFixed(2)}ms`);
	console.log(`    Max: ${stats.maxResponseTime.toFixed(2)}ms`);
	console.log(`    50th percentile: ${stats.p50.toFixed(2)}ms`);
	console.log(`    95th percentile: ${stats.p95.toFixed(2)}ms`);
	console.log(`    99th percentile: ${stats.p99.toFixed(2)}ms`);
	console.log(`    Variability (σ): ${stats.responseTimeVariability.toFixed(2)}ms`);

	console.log(`\n  Concurrency Metrics:`);
	console.log(`    Target Concurrency: ${testConfig.concurrency}`);
	console.log(`    Max Concurrent Connections: ${stats.maxConcurrentConnections}`);
	console.log(`    Avg Connection Time: ${stats.avgConnectionTime.toFixed(2)}ms`);
	console.log(`    Concurrency Efficiency: ${stats.concurrencyEfficiency.toFixed(2)} req/s per connection`);

	console.log(`\n  Response Time Distribution:`);
	console.log(`    < 50ms: ${timeDistribution.under50ms} (${((timeDistribution.under50ms / stats.successful) * 100).toFixed(1)}%)`);
	console.log(`    < 100ms: ${timeDistribution.under100ms} (${((timeDistribution.under100ms / stats.successful) * 100).toFixed(1)}%)`);
	console.log(`    < 500ms: ${timeDistribution.under500ms} (${((timeDistribution.under500ms / stats.successful) * 100).toFixed(1)}%)`);
	console.log(`    < 1s: ${timeDistribution.under1s} (${((timeDistribution.under1s / stats.successful) * 100).toFixed(1)}%)`);
	console.log(`    > 1s: ${timeDistribution.over1s} (${((timeDistribution.over1s / stats.successful) * 100).toFixed(1)}%)`);

	return stats;
}

/**
 * Main concurrency benchmark runner
 */
async function runConcurrencyBenchmarks() {
	console.log("🚀 Tenso Concurrency Benchmark");
	console.log("===============================\n");

	// Create and configure server
	const app = tenso({
		port: BENCHMARK_CONFIG.port,
		host: BENCHMARK_CONFIG.host,
		silent: true,
		logging: {enabled: false}
	});

	// Setup test endpoint
	app.get("/api/test", (req, res) => {
		// Simulate some processing time
		const processingTime = Math.random() * 5; // 0-5ms
		setTimeout(() => {
			res.json({
				message: "Concurrency test response",
				timestamp: Date.now(),
				processing: processingTime,
				requestId: Math.random().toString(36).substr(2, 9)
			});
		}, processingTime);
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
		if (targetTest && CONCURRENCY_TESTS[targetTest]) {
			allResults[targetTest] = await runConcurrencyBenchmark(
				targetTest,
				CONCURRENCY_TESTS[targetTest],
				BENCHMARK_CONFIG
			);
		} else {
			// Run all tests
			for (const [testName, testConfig] of Object.entries(CONCURRENCY_TESTS)) {
				allResults[testName] = await runConcurrencyBenchmark(testName, testConfig, BENCHMARK_CONFIG);
				// Delay between tests to let system stabilize
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
		}

		// Summary and analysis
		console.log(`\n🏁 Concurrency Benchmark Summary`);
		console.log("=================================");

		const validResults = Object.entries(allResults).filter(([_, stats]) => stats);

		// Performance vs Concurrency analysis
		console.log("\nPerformance vs Concurrency:");
		validResults
			.sort(([_, a], [__, b]) => CONCURRENCY_TESTS[a].concurrency - CONCURRENCY_TESTS[b].concurrency)
			.forEach(([testName, stats]) => {
				const testConfig = CONCURRENCY_TESTS[testName];
				console.log(`${testConfig.concurrency} connections: ${stats.requestsPerSecond.toFixed(2)} req/s (${stats.avgResponseTime.toFixed(2)}ms avg, ${stats.errorRate.toFixed(1)}% errors)`);
			});

		// Efficiency ranking
		console.log("\nEfficiency Ranking (req/s per connection):");
		validResults
			.sort(([_, a], [__, b]) => b.concurrencyEfficiency - a.concurrencyEfficiency)
			.forEach(([testName, stats], index) => {
				console.log(`${index + 1}. ${CONCURRENCY_TESTS[testName].name}: ${stats.concurrencyEfficiency.toFixed(2)} req/s per connection`);
			});

		// Load pattern analysis
		console.log("\nLoad Pattern Analysis:");
		const patternGroups = {};
		validResults.forEach(([testName, stats]) => {
			const pattern = CONCURRENCY_TESTS[testName].pattern;
			if (!patternGroups[pattern]) patternGroups[pattern] = [];
			patternGroups[pattern].push({testName, stats});
		});

		Object.entries(patternGroups).forEach(([pattern, tests]) => {
			console.log(`\n${pattern.toUpperCase()} Pattern:`);
			tests.forEach(({testName, stats}) => {
				console.log(`  ${CONCURRENCY_TESTS[testName].name}: ${stats.requestsPerSecond.toFixed(2)} req/s`);
			});
		});

		// Error rate analysis
		const highErrorTests = validResults.filter(([_, stats]) => stats.errorRate > 1);
		if (highErrorTests.length > 0) {
			console.log("\nHigh Error Rate Tests (>1%):");
			highErrorTests.forEach(([testName, stats]) => {
				console.log(`${CONCURRENCY_TESTS[testName].name}: ${stats.errorRate.toFixed(1)}% error rate`);
			});
		}

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
	runConcurrencyBenchmarks().catch(console.error);
}

// Export benchmark functions for benchmark.js runner
const benchmarks = {};

// Create benchmark functions for each test
for (const [testName, testConfig] of Object.entries(CONCURRENCY_TESTS)) {
	benchmarks[testName] = async function() {
		const startTime = performance.now();
		
		// Create and configure server
		const app = tenso({
			port: BENCHMARK_CONFIG.port,
			host: BENCHMARK_CONFIG.host,
			silent: true,
			logging: {enabled: false}
		});

		// Setup test endpoint
		app.get("/api/test", (req, res) => {
			const processingTime = Math.random() * 5;
			setTimeout(() => {
				res.json({
					message: "Concurrency test response",
					timestamp: Date.now(),
					processing: processingTime,
					requestId: Math.random().toString(36).substr(2, 9)
				});
			}, processingTime);
		});

		// Start server
		app.start();
		
		// Wait for server to be ready
		await new Promise(resolve => setTimeout(resolve, 100));

		try {
			// Run the specific test
			const stats = await runConcurrencyBenchmark(testName, testConfig, BENCHMARK_CONFIG);
			const endTime = performance.now();
			return endTime - startTime;
		} finally {
			app.stop();
		}
	};
}

// Add cleanup function
benchmarks.cleanup = async function() {
	// Cleanup function - servers are stopped in individual tests
	return Promise.resolve();
};

export default benchmarks;
