/**
 * Tenso Routing Performance Benchmark
 *
 * Tests routing performance across different URL patterns,
 * parameter extraction, and route matching scenarios.
 */

import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {tenso} from "../dist/tenso.js";

const require = createRequire(import.meta.url);
const http = require("http");

// Benchmark configuration
const BENCHMARK_CONFIG = {
	requests: 2000,
	concurrency: 15,
	warmupRequests: 200,
	port: 3002,
	host: "127.0.0.1"
};

/**
 * Routing test scenarios
 */
const ROUTING_TESTS = {
	"static-routes": {
		name: "Static Route Matching",
		description: "Tests performance of static route matching without parameters",
		routes: [
			"/api/users",
			"/api/products",
			"/api/orders",
			"/api/categories",
			"/api/settings"
		],
		setup: (app) => {
			app.get("/api/users", (req, res) => res.json({users: []}));
			app.get("/api/products", (req, res) => res.json({products: []}));
			app.get("/api/orders", (req, res) => res.json({orders: []}));
			app.get("/api/categories", (req, res) => res.json({categories: []}));
			app.get("/api/settings", (req, res) => res.json({settings: {}}));
		}
	},
	"parameterized-routes": {
		name: "Parameterized Route Matching",
		description: "Tests performance of routes with single parameters",
		routes: [
			"/api/users/123",
			"/api/products/456",
			"/api/orders/789",
			"/api/categories/abc",
			"/api/settings/def"
		],
		setup: (app) => {
			app.get("/api/users/:id", (req, res) => res.json({user: {id: req.params.id}}));
			app.get("/api/products/:id", (req, res) => res.json({product: {id: req.params.id}}));
			app.get("/api/orders/:id", (req, res) => res.json({order: {id: req.params.id}}));
			app.get("/api/categories/:id", (req, res) => res.json({category: {id: req.params.id}}));
			app.get("/api/settings/:key", (req, res) => res.json({setting: {key: req.params.key}}));
		}
	},
	"nested-parameters": {
		name: "Nested Parameter Routes",
		description: "Tests performance of routes with multiple nested parameters",
		routes: [
			"/api/users/123/posts/456",
			"/api/users/789/comments/012",
			"/api/products/345/reviews/678",
			"/api/orders/901/items/234",
			"/api/categories/567/subcategories/890"
		],
		setup: (app) => {
			app.get("/api/users/:userId/posts/:postId", (req, res) => {
				res.json({post: {id: req.params.postId, userId: req.params.userId}});
			});
			app.get("/api/users/:userId/comments/:commentId", (req, res) => {
				res.json({comment: {id: req.params.commentId, userId: req.params.userId}});
			});
			app.get("/api/products/:productId/reviews/:reviewId", (req, res) => {
				res.json({review: {id: req.params.reviewId, productId: req.params.productId}});
			});
			app.get("/api/orders/:orderId/items/:itemId", (req, res) => {
				res.json({item: {id: req.params.itemId, orderId: req.params.orderId}});
			});
			app.get("/api/categories/:categoryId/subcategories/:subId", (req, res) => {
				res.json({subcategory: {id: req.params.subId, categoryId: req.params.categoryId}});
			});
		}
	},
	"wildcard-routes": {
		name: "Wildcard Route Matching",
		description: "Tests performance of wildcard and catch-all routes",
		routes: [
			"/files/documents/report.pdf",
			"/files/images/photo.jpg",
			"/files/videos/movie.mp4",
			"/files/archives/backup.zip",
			"/files/scripts/deploy.sh"
		],
		setup: (app) => {
			app.get("/files/*", (req, res) => {
				const filepath = req.url.replace("/files/", "");
				res.json({file: {path: filepath, exists: true}});
			});
		}
	},
	"query-parameters": {
		name: "Query Parameter Processing",
		description: "Tests performance of query parameter parsing and handling",
		routes: [
			"/api/search?q=test&limit=10&offset=0",
			"/api/filter?category=electronics&price=100-500&sort=name",
			"/api/paginate?page=1&size=20&order=desc",
			"/api/export?format=csv&fields=name,email&compress=true",
			"/api/analytics?start=2024-01-01&end=2024-12-31&granularity=day"
		],
		setup: (app) => {
			app.get("/api/search", (req, res) => {
				res.json({
					query: req.parsed.searchParams.get("q"),
					limit: req.parsed.searchParams.get("limit"),
					offset: req.parsed.searchParams.get("offset")
				});
			});
			app.get("/api/filter", (req, res) => {
				res.json({
					category: req.parsed.searchParams.get("category"),
					price: req.parsed.searchParams.get("price"),
					sort: req.parsed.searchParams.get("sort")
				});
			});
			app.get("/api/paginate", (req, res) => {
				res.json({
					page: req.parsed.searchParams.get("page"),
					size: req.parsed.searchParams.get("size"),
					order: req.parsed.searchParams.get("order")
				});
			});
			app.get("/api/export", (req, res) => {
				res.json({
					format: req.parsed.searchParams.get("format"),
					fields: req.parsed.searchParams.get("fields"),
					compress: req.parsed.searchParams.get("compress")
				});
			});
			app.get("/api/analytics", (req, res) => {
				res.json({
					start: req.parsed.searchParams.get("start"),
					end: req.parsed.searchParams.get("end"),
					granularity: req.parsed.searchParams.get("granularity")
				});
			});
		}
	},
	"method-variations": {
		name: "HTTP Method Variations",
		description: "Tests performance across different HTTP methods",
		routes: [
			{method: "GET", path: "/api/data"},
			{method: "POST", path: "/api/data"},
			{method: "PUT", path: "/api/data"},
			{method: "PATCH", path: "/api/data"},
			{method: "DELETE", path: "/api/data"}
		],
		setup: (app) => {
			app.get("/api/data", (req, res) => res.json({method: "GET", data: []}));
			app.post("/api/data", (req, res) => res.json({method: "POST", created: true}));
			app.put("/api/data", (req, res) => res.json({method: "PUT", updated: true}));
			app.patch("/api/data", (req, res) => res.json({method: "PATCH", patched: true}));
			app.delete("/api/data", (req, res) => res.json({method: "DELETE", deleted: true}));
		},
		requestOptions: (route) => ({
			method: route.method || "GET",
			path: route.path || route,
			headers: {
				"Content-Type": "application/json"
			},
			...(route.method === "POST" || route.method === "PUT" || route.method === "PATCH" ? {
				body: JSON.stringify({test: "data"})
			} : {})
		})
	}
};

/**
 * HTTP request helper with support for different methods and bodies
 */
function makeRequest(options, config) {
	return new Promise((resolve, reject) => {
		const startTime = performance.now();
		const reqOptions = {
			hostname: config.host,
			port: config.port,
			path: options.path || options,
			method: options.method || "GET",
			headers: options.headers || {}
		};

		const req = http.request(reqOptions, (res) => {
			let data = "";
			res.on("data", chunk => data += chunk);
			res.on("end", () => {
				const endTime = performance.now();
				resolve({
					statusCode: res.statusCode,
					responseTime: endTime - startTime,
					size: Buffer.byteLength(data, "utf8")
				});
			});
		});

		req.on("error", reject);
		req.on("timeout", () => reject(new Error("Request timeout")));
		req.setTimeout(5000);

		if (options.body) {
			req.write(options.body);
		}

		req.end();
	});
}

/**
 * Runs a batch of concurrent requests
 */
async function runRequestBatch(routes, config, getRequestOptions) {
	const promises = [];
	const results = [];

	for (let i = 0; i < config.concurrency; i++) {
		const route = routes[Math.floor(Math.random() * routes.length)];
		const requestOptions = getRequestOptions ? getRequestOptions(route) : {path: route};
		promises.push(makeRequest(requestOptions, config));
	}

	try {
		const batchResults = await Promise.all(promises);
		results.push(...batchResults);
	} catch (error) {
		console.error("Batch error:", error.message);
	}

	return results;
}

/**
 * Runs routing benchmark for a specific test scenario
 */
async function runRoutingBenchmark(testName, testConfig, config) {
	console.log(`\n┌─ ${testConfig.name}`);
	console.log(`│  ${testConfig.description}`);
	console.log(`└─ Running ${config.requests} requests with ${config.concurrency} concurrent connections\n`);

	const results = [];
	const routes = testConfig.routes;
	const getRequestOptions = testConfig.requestOptions;

	// Warmup phase
	console.log(`  Warming up with ${config.warmupRequests} requests...`);
	for (let i = 0; i < config.warmupRequests; i += config.concurrency) {
		await runRequestBatch(routes, config, getRequestOptions);
	}

	// Benchmark phase
	console.log("  Running benchmark...");
	const benchmarkStart = performance.now();

	for (let i = 0; i < config.requests; i += config.concurrency) {
		const batchResults = await runRequestBatch(routes, config, getRequestOptions);
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
		throughputMBps: (responseSizes.reduce((a, b) => a + b, 0) / totalDuration) / (1024 * 1024)
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

	return stats;
}

/**
 * Main benchmark runner
 */
async function runRoutingBenchmarks() {
	console.log("🛣️  Tenso Routing Performance Benchmark");
	console.log("========================================\n");

	// Create and configure server
	const app = tenso({
		port: BENCHMARK_CONFIG.port,
		host: BENCHMARK_CONFIG.host,
		silent: true,
		logging: {enabled: false}
	});

	// Setup all test routes
	for (const [testName, testConfig] of Object.entries(ROUTING_TESTS)) {
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
		if (targetTest && ROUTING_TESTS[targetTest]) {
			allResults[targetTest] = await runRoutingBenchmark(
				targetTest,
				ROUTING_TESTS[targetTest],
				BENCHMARK_CONFIG
			);
		} else {
			// Run all tests
			for (const [testName, testConfig] of Object.entries(ROUTING_TESTS)) {
				allResults[testName] = await runRoutingBenchmark(testName, testConfig, BENCHMARK_CONFIG);
			}
		}

		// Summary
		console.log(`\n🏁 Routing Benchmark Summary`);
		console.log("============================");
		for (const [testName, stats] of Object.entries(allResults)) {
			if (stats) {
				console.log(`${ROUTING_TESTS[testName].name}: ${stats.requestsPerSecond.toFixed(2)} req/s (${stats.avgResponseTime.toFixed(2)}ms avg)`);
			}
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
	runRoutingBenchmarks().catch(console.error);
}
