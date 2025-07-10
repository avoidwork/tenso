/**
 * Tenso Memory Benchmark
 *
 * Specialized benchmark for monitoring memory usage patterns during load testing
 * Tests memory consumption, garbage collection behavior, and memory leaks
 */

import {tenso} from "../dist/tenso.js";
import http from "node:http";
import {performance} from "node:perf_hooks";

// Memory benchmark configuration
const MEMORY_BENCHMARK_PORT = 8081;
const MEMORY_TEST_DURATION = 30000; // 30 seconds
const MEMORY_SAMPLE_INTERVAL = 1000; // 1 second
const CONCURRENT_CONNECTIONS = 20;
const REQUEST_INTERVAL = 50; // 50ms between requests per connection

/**
 * Memory usage tracker
 */
class MemoryTracker {
	constructor() {
		this.samples = [];
		this.interval = null;
		this.gcEvents = [];
	}

	/**
	 * Start tracking memory usage
	 */
	start() {
		// Track GC events if available
		if (global.gc) {
			const originalGc = global.gc;
			global.gc = (...args) => {
				const timestamp = Date.now();
				const memBefore = process.memoryUsage();
				const result = originalGc.apply(global, args);
				const memAfter = process.memoryUsage();

				this.gcEvents.push({
					timestamp,
					memoryBefore: memBefore,
					memoryAfter: memAfter,
					freed: memBefore.heapUsed - memAfter.heapUsed
				});

				return result;
			};
		}

		// Sample memory usage periodically
		this.interval = setInterval(() => {
			const memory = process.memoryUsage();
			const timestamp = Date.now();

			this.samples.push({
				timestamp,
				rss: memory.rss,
				heapTotal: memory.heapTotal,
				heapUsed: memory.heapUsed,
				external: memory.external,
				arrayBuffers: memory.arrayBuffers || 0
			});
		}, MEMORY_SAMPLE_INTERVAL);
	}

	/**
	 * Stop tracking and return collected data
	 */
	stop() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}

		return {
			samples: this.samples,
			gcEvents: this.gcEvents,
			summary: this.calculateSummary()
		};
	}

	/**
	 * Calculate memory usage summary statistics
	 */
	calculateSummary() {
		if (this.samples.length === 0) {
			return null;
		}

		const rssValues = this.samples.map(s => s.rss);
		const heapUsedValues = this.samples.map(s => s.heapUsed);
		const heapTotalValues = this.samples.map(s => s.heapTotal);

		const calculateStats = (values) => {
			const sorted = values.slice().sort((a, b) => a - b);
			return {
				min: sorted[0],
				max: sorted[sorted.length - 1],
				avg: values.reduce((sum, v) => sum + v, 0) / values.length,
				median: sorted[Math.floor(sorted.length / 2)],
				p95: sorted[Math.floor(sorted.length * 0.95)],
				p99: sorted[Math.floor(sorted.length * 0.99)]
			};
		};

		return {
			duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
			sampleCount: this.samples.length,
			rss: calculateStats(rssValues),
			heapUsed: calculateStats(heapUsedValues),
			heapTotal: calculateStats(heapTotalValues),
			gcEventCount: this.gcEvents.length,
			totalMemoryFreed: this.gcEvents.reduce((sum, event) => sum + Math.max(0, event.freed), 0)
		};
	}
}

/**
 * Memory test scenarios
 */
const MEMORY_SCENARIOS = {
	"large-objects": {
		name: "Large Object Creation",
		description: "Tests memory usage with large object creation and serialization",
		setup: (app) => {
			app.get("/large-objects", (req, res) => {
				const largeObject = {
					data: Array.from({length: 1000}, (_, i) => ({
						id: i,
						payload: "x".repeat(1000),
						nested: {
							values: Array.from({length: 100}, (_, j) => j * Math.random()),
							metadata: {
								created: new Date().toISOString(),
								processed: false
							}
						}
					}))
				};
				res.json(largeObject);
			});
		}
	},
	"string-manipulation": {
		name: "String Manipulation",
		description: "Tests memory usage with heavy string operations",
		setup: (app) => {
			app.get("/string-manipulation", (req, res) => {
				let result = "";
				for (let i = 0; i < 1000; i++) {
					result += `Processing item ${i} with random data: ${Math.random().toString(36).substring(7)}\n`;
				}
				res.send(result);
			});
		}
	},
	"buffer-operations": {
		name: "Buffer Operations",
		description: "Tests memory usage with buffer creation and manipulation",
		setup: (app) => {
			app.get("/buffer-operations", (req, res) => {
				const buffers = [];
				for (let i = 0; i < 100; i++) {
					const buffer = Buffer.alloc(1024, i % 256);
					buffers.push(buffer.toString("base64"));
				}
				res.json({buffers: buffers.slice(0, 10)}); // Only return first 10 for response size
			});
		}
	},
	"recursive-data": {
		name: "Recursive Data Structures",
		description: "Tests memory usage with nested recursive data",
		setup: (app) => {
			app.get("/recursive-data", (req, res) => {
				const createNestedObject = (depth) => {
					if (depth === 0) {
						return {value: Math.random(), leaf: true};
					}
					return {
						value: Math.random(),
						children: Array.from({length: 3}, () => createNestedObject(depth - 1)),
						metadata: {
							depth,
							created: Date.now()
						}
					};
				};

				const data = createNestedObject(6);
				res.json(data);
			});
		}
	}
};

/**
 * Load generator for memory testing
 */
class MemoryLoadGenerator {
	constructor(port, scenario) {
		this.port = port;
		this.scenario = scenario;
		this.connections = [];
		this.running = false;
		this.stats = {
			requestsSent: 0,
			responsesReceived: 0,
			errors: 0,
			totalLatency: 0
		};
	}

	/**
	 * Make a single HTTP request
	 */
	makeRequest() {
		return new Promise((resolve) => {
			const startTime = performance.now();

			const req = http.request({
				hostname: "localhost",
				port: this.port,
				path: this.scenario.path,
				method: "GET",
				headers: {
					"Accept": "application/json",
					"Connection": "keep-alive"
				}
			}, (res) => {
				let data = "";
				res.on("data", chunk => data += chunk);
				res.on("end", () => {
					const endTime = performance.now();
					this.stats.responsesReceived++;
					this.stats.totalLatency += (endTime - startTime);
					resolve();
				});
			});

			req.on("error", () => {
				this.stats.errors++;
				resolve();
			});

			req.setTimeout(5000, () => {
				req.destroy();
				this.stats.errors++;
				resolve();
			});

			this.stats.requestsSent++;
			req.end();
		});
	}

	/**
	 * Start generating load
	 */
	async start() {
		this.running = true;

		// Create concurrent connections
		const connectionPromises = [];

		for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
			const connectionPromise = this.runConnection();
			connectionPromises.push(connectionPromise);
		}

		await Promise.all(connectionPromises);
	}

	/**
	 * Run a single connection that makes repeated requests
	 */
	async runConnection() {
		while (this.running) {
			await this.makeRequest();
			await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
		}
	}

	/**
	 * Stop generating load
	 */
	stop() {
		this.running = false;
	}

	/**
	 * Get current statistics
	 */
	getStats() {
		return {
			...this.stats,
			averageLatency: this.stats.responsesReceived > 0
				? this.stats.totalLatency / this.stats.responsesReceived
				: 0
		};
	}
}

/**
 * Memory benchmark runner
 */
class MemoryBenchmarkRunner {
	constructor() {
		this.app = null;
		this.server = null;
	}

	/**
	 * Setup the Tenso application
	 */
	async setupApp() {
		this.app = tenso({
			port: MEMORY_BENCHMARK_PORT,
			silent: true,
			logging: {enabled: false}
		});

		// Setup all memory test scenarios
		for (const [key, scenario] of Object.entries(MEMORY_SCENARIOS)) {
			scenario.path = `/${key}`;
			scenario.setup(this.app);
		}

		this.server = this.app.start();
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	/**
	 * Clean up resources
	 */
	async cleanup() {
		if (this.app) {
			this.app.stop();
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	/**
	 * Run memory benchmark for a specific scenario
	 */
	async runScenario(scenarioKey, scenario) {
		console.log(`\n┌─ ${scenario.name}`);
		console.log(`│  ${scenario.description}`);
		console.log(`│  Duration: ${MEMORY_TEST_DURATION / 1000}s`);
		console.log(`│  Concurrent connections: ${CONCURRENT_CONNECTIONS}`);
		console.log(`└─ Monitoring memory usage...\n`);

		// Start memory tracking
		const memoryTracker = new MemoryTracker();
		memoryTracker.start();

		// Start load generation
		const loadGenerator = new MemoryLoadGenerator(MEMORY_BENCHMARK_PORT, {
			...scenario,
			path: `/${scenarioKey}`
		});

		// Run the test
		const testPromise = loadGenerator.start();

		// Stop after specified duration
		setTimeout(() => {
			loadGenerator.stop();
		}, MEMORY_TEST_DURATION);

		await testPromise;

		// Stop memory tracking
		const memoryData = memoryTracker.stop();
		const loadStats = loadGenerator.getStats();

		// Display results
		this.displayResults(scenario.name, memoryData, loadStats);

		return {memoryData, loadStats};
	}

	/**
	 * Display benchmark results
	 */
	displayResults(scenarioName, memoryData, loadStats) {
		const {summary} = memoryData;

		console.log(`  Load Testing Results:`);
		console.log(`    Requests sent: ${loadStats.requestsSent.toLocaleString()}`);
		console.log(`    Responses received: ${loadStats.responsesReceived.toLocaleString()}`);
		console.log(`    Errors: ${loadStats.errors.toLocaleString()}`);
		console.log(`    Average latency: ${loadStats.averageLatency.toFixed(2)}ms`);
		console.log(`    Requests/sec: ${((loadStats.responsesReceived / (summary.duration / 1000))).toFixed(2)}`);

		console.log(`\n  Memory Usage (MB):`);
		console.log(`    RSS - Min: ${(summary.rss.min / 1024 / 1024).toFixed(2)}, Max: ${(summary.rss.max / 1024 / 1024).toFixed(2)}, Avg: ${(summary.rss.avg / 1024 / 1024).toFixed(2)}`);
		console.log(`    Heap Used - Min: ${(summary.heapUsed.min / 1024 / 1024).toFixed(2)}, Max: ${(summary.heapUsed.max / 1024 / 1024).toFixed(2)}, Avg: ${(summary.heapUsed.avg / 1024 / 1024).toFixed(2)}`);
		console.log(`    Heap Total - Min: ${(summary.heapTotal.min / 1024 / 1024).toFixed(2)}, Max: ${(summary.heapTotal.max / 1024 / 1024).toFixed(2)}, Avg: ${(summary.heapTotal.avg / 1024 / 1024).toFixed(2)}`);

		console.log(`\n  Garbage Collection:`);
		console.log(`    GC Events: ${summary.gcEventCount}`);
		console.log(`    Total Memory Freed: ${(summary.totalMemoryFreed / 1024 / 1024).toFixed(2)} MB`);
		console.log(`    Memory Samples: ${summary.sampleCount}`);

		// Memory growth analysis
		const samples = memoryData.samples;
		if (samples.length > 2) {
			const startHeap = samples[0].heapUsed;
			const endHeap = samples[samples.length - 1].heapUsed;
			const growth = endHeap - startHeap;
			const growthRate = (growth / (summary.duration / 1000) / 1024).toFixed(2); // KB/sec

			console.log(`\n  Memory Growth:`);
			console.log(`    Total heap growth: ${(growth / 1024 / 1024).toFixed(2)} MB`);
			console.log(`    Growth rate: ${growthRate} KB/sec`);

			if (growth > 10 * 1024 * 1024) { // More than 10MB growth
				console.log(`    ⚠️  Potential memory leak detected!`);
			}
		}
	}

	/**
	 * Run all memory benchmarks
	 */
	async runAll() {
		console.log("🧠 Tenso Memory Benchmark Suite");
		console.log("===============================\n");

		console.log(`Configuration:`);
		console.log(`  Test duration: ${MEMORY_TEST_DURATION / 1000} seconds`);
		console.log(`  Concurrent connections: ${CONCURRENT_CONNECTIONS}`);
		console.log(`  Request interval: ${REQUEST_INTERVAL}ms`);
		console.log(`  Memory sample interval: ${MEMORY_SAMPLE_INTERVAL}ms`);
		console.log(`  Server port: ${MEMORY_BENCHMARK_PORT}`);

		try {
			// Setup the application
			console.log(`\nSetting up Tenso application...`);
			await this.setupApp();
			console.log(`✓ Server ready on port ${MEMORY_BENCHMARK_PORT}`);

			const allResults = new Map();

			// Run each memory scenario
			for (const [key, scenario] of Object.entries(MEMORY_SCENARIOS)) {
				const result = await this.runScenario(key, scenario);
				allResults.set(key, result);

				// Brief pause between scenarios
				await new Promise(resolve => setTimeout(resolve, 2000));
			}

			// Display summary
			this.displaySummary(allResults);

		} finally {
			await this.cleanup();
		}
	}

	/**
	 * Display summary of all memory benchmark results
	 */
	displaySummary(results) {
		console.log(`\n\n📊 Memory Benchmark Summary`);
		console.log(`============================\n`);

		console.log(`Scenario                │ Peak Heap │ Avg Heap │ Growth  │ GC Events │ Req/sec`);
		console.log(`────────────────────────┼───────────┼──────────┼─────────┼───────────┼─────────`);

		for (const [key, result] of results.entries()) {
			const scenario = MEMORY_SCENARIOS[key];
			const {memoryData, loadStats} = result;
			const {summary} = memoryData;

			const name = scenario.name.substring(0, 23).padEnd(23);
			const peakHeap = `${(summary.heapUsed.max / 1024 / 1024).toFixed(1)} MB`.padStart(9);
			const avgHeap = `${(summary.heapUsed.avg / 1024 / 1024).toFixed(1)} MB`.padStart(8);

			const samples = memoryData.samples;
			const growth = samples.length > 1
				? ((samples[samples.length - 1].heapUsed - samples[0].heapUsed) / 1024 / 1024).toFixed(1)
				: "0.0";
			const growthStr = `${growth} MB`.padStart(7);

			const gcEvents = summary.gcEventCount.toString().padStart(9);
			const reqPerSec = ((loadStats.responsesReceived / (summary.duration / 1000))).toFixed(1).padStart(7);

			console.log(`${name} │ ${peakHeap} │ ${avgHeap} │ ${growthStr} │ ${gcEvents} │ ${reqPerSec}`);
		}

		console.log(`\n💡 Tips for memory optimization:`);
		console.log(`   • Monitor heap growth rate - consistent growth may indicate leaks`);
		console.log(`   • High GC frequency can impact performance`);
		console.log(`   • Consider object pooling for frequently created objects`);
		console.log(`   • Use streaming for large data sets when possible`);
	}
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const runner = new MemoryBenchmarkRunner();

	if (args.length > 0) {
		const scenarioKey = args[0];
		if (MEMORY_SCENARIOS[scenarioKey]) {
			console.log(`Running memory benchmark: ${MEMORY_SCENARIOS[scenarioKey].name}`);
			await runner.setupApp();
			await runner.runScenario(scenarioKey, MEMORY_SCENARIOS[scenarioKey]);
			await runner.cleanup();
		} else {
			console.error(`Unknown scenario: ${scenarioKey}`);
			console.log(`Available scenarios: ${Object.keys(MEMORY_SCENARIOS).join(", ")}`);
			process.exit(1);
		}
	} else {
		await runner.runAll();
	}
}

// Handle process termination gracefully
process.on("SIGINT", () => {
	console.log("\n\n⚠️  Memory benchmark interrupted by user");
	process.exit(0);
});

// Run the benchmark
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(error => {
		console.error("❌ Memory benchmark failed:", error.message);
		process.exit(1);
	});
}

// Export benchmark functions for benchmark.js runner
const benchmarks = {};

// Create benchmark functions for each scenario
for (const [scenarioKey, scenario] of Object.entries(MEMORY_SCENARIOS)) {
	benchmarks[scenarioKey] = async function() {
		const startTime = performance.now();
		
		// Create a simplified version of the memory benchmark
		const runner = new MemoryBenchmarkRunner();
		await runner.setupApp();
		
		try {
			// Run the specific scenario
			const result = await runner.runScenario(scenarioKey, scenario);
			const endTime = performance.now();
			return endTime - startTime;
		} finally {
			await runner.cleanup();
		}
	};
}

// Add cleanup function
benchmarks.cleanup = async function() {
	// Cleanup function - servers are stopped in individual tests
	return Promise.resolve();
};

export default benchmarks;
