#!/usr/bin/env node

/**
 * Load testing benchmarks for Tenso framework using autocannon
 */

import autocannon from "autocannon";
import { tenso } from "../dist/tenso.js";

/**
 * Creates a test server with various endpoints
 */
function createTestServer (config = {}) {
	const server = tenso({
		port: 0, // Use random available port
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		rate: { enabled: false },
		security: { csrf: false },
		...config
	});

	// Simple endpoints
	server.get("/ping", (req, res) => {
		res.send({ message: "pong", timestamp: Date.now() });
	});

	server.get("/hello", (req, res) => {
		res.send({ message: "Hello World!" });
	});

	// JSON endpoint with data
	server.get("/users", (req, res) => {
		const users = Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			name: `User ${i + 1}`,
			email: `user${i + 1}@example.com`,
			active: i % 2 === 0
		}));
		res.send({ users, total: users.length });
	});

	// Large JSON response
	server.get("/large", (req, res) => {
		const items = Array.from({ length: 1000 }, (_, i) => ({
			id: i + 1,
			title: `Item ${i + 1}`,
			description: `This is a longer description for item ${i + 1}`,
			metadata: {
				created: new Date().toISOString(),
				tags: [`tag${i % 10}`, "general"],
				score: Math.random() * 100
			}
		}));
		res.send({ items, total: items.length, generated: Date.now() });
	});

	// POST endpoint for testing request body handling
	server.post("/echo", (req, res) => {
		res.send({
			received: req.body,
			method: req.method,
			timestamp: Date.now()
		});
	});

	// Error endpoint for testing error handling
	server.get("/error", (req, res) => {
		res.error(500, "Intentional error for testing");
	});

	// Parameterized endpoint
	server.get("/users/:id", (req, res) => {
		const id = parseInt(req.url.split("/")[2]);
		if (isNaN(id)) {
			res.error(400, "Invalid user ID");

			return;
		}

		res.send({
			id,
			name: `User ${id}`,
			email: `user${id}@example.com`,
			profile: {
				bio: `Bio for user ${id}`,
				joinDate: new Date().toISOString()
			}
		});
	});

	return server;
}

/**
 * Starts a server and waits for it to be listening
 * @param {Object} server - The Tenso server instance
 * @returns {Promise<Object>} Promise that resolves with the server instance when listening
 */
function startServer (server) {
	return new Promise((resolve, reject) => {
		server.start();

		if (server.server) {
			server.server.on("listening", () => {
				resolve(server);
			});

			server.server.on("error", err => {
				reject(err);
			});
		} else {
			reject(new Error("Server was not created"));
		}
	});
}

/**
 * Runs a load test with autocannon
 */
async function runLoadTest (options) {
	const {
		url,
		title,
		connections = 10,
		duration = 10,
		method = "GET",
		body,
		headers,
		...otherOptions
	} = options;

	console.log(`\n🚀 ${title}`);
	console.log("-".repeat(50));
	console.log(`URL: ${url}`);
	console.log(`Method: ${method}`);
	console.log(`Connections: ${connections}`);
	console.log(`Duration: ${duration}s`);

	const result = await autocannon({
		url,
		connections,
		duration,
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			"Content-Type": "application/json",
			...headers
		},
		...otherOptions
	});

	// Print results
	console.log("\n📊 Results:");
	console.log(`  Requests/sec: ${result.requests.average.toFixed(2)}`);
	console.log(`  Latency avg: ${result.latency.average.toFixed(2)}ms`);
	console.log(`  Latency p99: ${result.latency.p99.toFixed(2)}ms`);
	console.log(`  Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
	console.log(`  Total requests: ${result.requests.total}`);
	console.log(`  Total bytes: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
	console.log(`  Error rate: ${(result.errors / result.requests.total * 100).toFixed(2)}%`);

	if (result.errors > 0) {
		console.log(`  ⚠️  Errors: ${result.errors}`);
		if (result["1xx"] > 0) console.log(`    1xx: ${result["1xx"]}`);
		if (result["2xx"] > 0) console.log(`    2xx: ${result["2xx"]}`);
		if (result["3xx"] > 0) console.log(`    3xx: ${result["3xx"]}`);
		if (result["4xx"] > 0) console.log(`    4xx: ${result["4xx"]}`);
		if (result["5xx"] > 0) console.log(`    5xx: ${result["5xx"]}`);
	}

	return result;
}

/**
 * Basic load tests
 */
async function basicLoadTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 Basic Load Tests");
	console.log("=".repeat(50));

	const tests = [
		{
			title: "Simple Ping Test (Low Load)",
			url: `${baseUrl}/ping`,
			connections: 10,
			duration: 10
		},
		{
			title: "Simple Ping Test (Medium Load)",
			url: `${baseUrl}/ping`,
			connections: 50,
			duration: 10
		},
		{
			title: "Simple Ping Test (High Load)",
			url: `${baseUrl}/ping`,
			connections: 100,
			duration: 10
		},
		{
			title: "JSON Response Test",
			url: `${baseUrl}/users`,
			connections: 25,
			duration: 10
		},
		{
			title: "Large JSON Response Test",
			url: `${baseUrl}/large`,
			connections: 10,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		// Brief pause between tests
		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	return results;
}

/**
 * POST request load tests
 */
async function postLoadTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 POST Request Load Tests");
	console.log("=".repeat(50));

	const tests = [
		{
			title: "Small POST Body Test",
			url: `${baseUrl}/echo`,
			method: "POST",
			body: { message: "Hello World", timestamp: Date.now() },
			connections: 25,
			duration: 10
		},
		{
			title: "Medium POST Body Test",
			url: `${baseUrl}/echo`,
			method: "POST",
			body: {
				users: Array.from({ length: 50 }, (_, i) => ({
					id: i,
					name: `User ${i}`,
					active: i % 2 === 0
				}))
			},
			connections: 15,
			duration: 10
		},
		{
			title: "Large POST Body Test",
			url: `${baseUrl}/echo`,
			method: "POST",
			body: {
				items: Array.from({ length: 200 }, (_, i) => ({
					id: i,
					title: `Item ${i}`,
					description: `Description for item ${i}`.repeat(5),
					metadata: { created: Date.now(), tags: [`tag${i}`] }
				}))
			},
			connections: 10,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	return results;
}

/**
 * Tests different response formats
 */
async function formatLoadTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 Response Format Load Tests");
	console.log("=".repeat(50));

	const tests = [
		{
			title: "JSON Format Test",
			url: `${baseUrl}/users`,
			headers: { "Accept": "application/json" },
			connections: 20,
			duration: 10
		},
		{
			title: "XML Format Test",
			url: `${baseUrl}/users`,
			headers: { "Accept": "application/xml" },
			connections: 20,
			duration: 10
		},
		{
			title: "CSV Format Test",
			url: `${baseUrl}/users`,
			headers: { "Accept": "text/csv" },
			connections: 20,
			duration: 10
		},
		{
			title: "YAML Format Test",
			url: `${baseUrl}/users`,
			headers: { "Accept": "application/yaml" },
			connections: 20,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	return results;
}

/**
 * Tests with rate limiting enabled
 */
async function rateLimitLoadTests () {
	console.log("\n🔥 Rate Limiting Load Tests");
	console.log("=".repeat(50));

	const server = createTestServer({
		rate: {
			enabled: true,
			limit: 50, // Low limit for testing
			reset: 60, // 1 minute window
			status: 429
		}
	});

	const startedServer = await startServer(server);
	const baseUrl = `http://localhost:${startedServer.server.address().port}`;

	const tests = [
		{
			title: "Rate Limit Test (Under Limit)",
			url: `${baseUrl}/ping`,
			connections: 5,
			duration: 10
		},
		{
			title: "Rate Limit Test (At Limit)",
			url: `${baseUrl}/ping`,
			connections: 20,
			duration: 10
		},
		{
			title: "Rate Limit Test (Over Limit)",
			url: `${baseUrl}/ping`,
			connections: 50,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		await new Promise(resolve => setTimeout(resolve, 2000)); // Longer pause for rate limit reset
	}

	startedServer.stop();

	return results;
}

/**
 * Stress tests with very high load
 */
async function stressTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 Stress Tests");
	console.log("=".repeat(50));

	const tests = [
		{
			title: "Stress Test - High Connections",
			url: `${baseUrl}/ping`,
			connections: 200,
			duration: 15
		},
		{
			title: "Stress Test - Very High Connections",
			url: `${baseUrl}/ping`,
			connections: 500,
			duration: 10
		},
		{
			title: "Stress Test - JSON with High Load",
			url: `${baseUrl}/users`,
			connections: 100,
			duration: 15
		},
		{
			title: "Stress Test - Large Response High Load",
			url: `${baseUrl}/large`,
			connections: 50,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		console.log("\n⚠️  Warning: Running high-load stress test...");
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		// Longer pause between stress tests
		await new Promise(resolve => setTimeout(resolve, 3000));
	}

	return results;
}

/**
 * Parameterized endpoint tests
 */
async function parameterizedTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 Parameterized Endpoint Tests");
	console.log("=".repeat(50));

	// Generate URLs with different user IDs
	const userIds = Array.from({ length: 100 }, (_, i) => i + 1);
	const requests = userIds.map(id => ({ path: `/users/${id}` }));

	const result = await runLoadTest({
		title: "Parameterized Routes Test",
		url: baseUrl,
		requests: requests,
		connections: 25,
		duration: 15
	});

	return [{ title: "Parameterized Routes", result }];
}

/**
 * Mixed workload tests
 */
async function mixedWorkloadTests (server) {
	const baseUrl = `http://localhost:${server.server.address().port}`;

	console.log("\n🔥 Mixed Workload Tests");
	console.log("=".repeat(50));

	// Create a mixed set of requests
	const requests = [
		{ path: "/ping", method: "GET" },
		{ path: "/hello", method: "GET" },
		{ path: "/users", method: "GET" },
		{ path: "/users/1", method: "GET" },
		{ path: "/users/50", method: "GET" },
		{
			path: "/echo",
			method: "POST",
			body: JSON.stringify({ test: "data", id: Math.random() })
		}
	];

	const result = await runLoadTest({
		title: "Mixed Workload Test",
		url: baseUrl,
		requests: requests,
		connections: 30,
		duration: 20
	});

	return [{ title: "Mixed Workload", result }];
}

/**
 * Tests with hypermedia options explicitly enabled for performance comparison
 */
async function hypermediaEnabledTests () {
	console.log("\n🔥 Hypermedia Enabled Tests");
	console.log("=".repeat(50));

	const server = createTestServer({
		hypermedia: {
			enabled: true,
			header: true
		}
	});

	const startedServer = await startServer(server);
	const baseUrl = `http://localhost:${startedServer.server.address().port}`;

	const tests = [
		{
			title: "Ping Test (With Hypermedia)",
			url: `${baseUrl}/ping`,
			connections: 50,
			duration: 10
		},
		{
			title: "JSON Response (With Hypermedia)",
			url: `${baseUrl}/users`,
			connections: 25,
			duration: 10
		},
		{
			title: "Large JSON Response (With Hypermedia)",
			url: `${baseUrl}/large`,
			connections: 10,
			duration: 10
		},
		{
			title: "Parameterized Route (With Hypermedia)",
			url: `${baseUrl}/users/42`,
			connections: 20,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	startedServer.stop();

	return results;
}

/**
 * Tests with hypermedia options disabled for performance comparison
 */
async function hypermediaDisabledTests () {
	console.log("\n🔥 Hypermedia Disabled Tests");
	console.log("=".repeat(50));

	const server = createTestServer({
		hypermedia: {
			enabled: false,
			header: false
		}
	});

	const startedServer = await startServer(server);
	const baseUrl = `http://localhost:${startedServer.server.address().port}`;

	const tests = [
		{
			title: "Ping Test (No Hypermedia)",
			url: `${baseUrl}/ping`,
			connections: 50,
			duration: 10
		},
		{
			title: "JSON Response (No Hypermedia)",
			url: `${baseUrl}/users`,
			connections: 25,
			duration: 10
		},
		{
			title: "Large JSON Response (No Hypermedia)",
			url: `${baseUrl}/large`,
			connections: 10,
			duration: 10
		},
		{
			title: "Parameterized Route (No Hypermedia)",
			url: `${baseUrl}/users/42`,
			connections: 20,
			duration: 10
		}
	];

	const results = [];
	for (const test of tests) {
		const result = await runLoadTest(test);
		results.push({ ...test, result });

		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	startedServer.stop();

	return results;
}

/**
 * Generates a summary report of all test results
 */
function generateSummaryReport (allResults) {
	console.log("\n📊 Load Test Summary Report");
	console.log("=".repeat(70));

	let totalTests = 0;
	let totalRequests = 0;
	let totalErrors = 0;
	let bestRps = 0;
	let worstRps = Infinity;
	let bestLatency = Infinity;
	let worstLatency = 0;

	console.log("| Test Category | Avg RPS | Avg Latency | P99 Latency | Error Rate |");
	console.log("|" + "-".repeat(68) + "|");

	for (const category of allResults) {
		const categoryName = category.name;
		const results = category.results;

		const avgRps = results.reduce((sum, r) => sum + r.result.requests.average, 0) / results.length;
		const avgLatency = results.reduce((sum, r) => sum + r.result.latency.average, 0) / results.length;
		const avgP99 = results.reduce((sum, r) => sum + r.result.latency.p99, 0) / results.length;
		const avgErrorRate = results.reduce((sum, r) => sum + r.result.errors / r.result.requests.total * 100, 0) / results.length;

		console.log(`| ${categoryName.padEnd(13)} | ${avgRps.toFixed(1).padStart(7)} | ${avgLatency.toFixed(1).padStart(11)} | ${avgP99.toFixed(1).padStart(11)} | ${avgErrorRate.toFixed(2).padStart(9)}% |`);

		// Track overall stats
		totalTests += results.length;
		results.forEach(r => { // eslint-disable-line no-loop-func
			totalRequests += r.result.requests.total;
			totalErrors += r.result.errors;
			bestRps = Math.max(bestRps, r.result.requests.average);
			worstRps = Math.min(worstRps, r.result.requests.average);
			bestLatency = Math.min(bestLatency, r.result.latency.average);
			worstLatency = Math.max(worstLatency, r.result.latency.average);
		});
	}

	console.log("|" + "-".repeat(68) + "|");

	console.log("\n🎯 Key Metrics:");
	console.log(`  Total tests run: ${totalTests}`);
	console.log(`  Total requests: ${totalRequests.toLocaleString()}`);
	console.log(`  Total errors: ${totalErrors}`);
	console.log(`  Overall error rate: ${(totalErrors / totalRequests * 100).toFixed(2)}%`);
	console.log(`  Best RPS: ${bestRps.toFixed(1)}`);
	console.log(`  Worst RPS: ${worstRps.toFixed(1)}`);
	console.log(`  Best latency: ${bestLatency.toFixed(1)}ms`);
	console.log(`  Worst latency: ${worstLatency.toFixed(1)}ms`);

	console.log("\n💡 Performance Insights:");
	if (bestRps > 1000) {
		console.log(`  ✅ Excellent peak performance (${bestRps.toFixed(0)} RPS)`);
	} else if (bestRps > 500) {
		console.log(`  ✅ Good peak performance (${bestRps.toFixed(0)} RPS)`);
	} else {
		console.log(`  ⚠️  Consider optimization (peak: ${bestRps.toFixed(0)} RPS)`);
	}

	if (bestLatency < 10) {
		console.log(`  ✅ Excellent response times (${bestLatency.toFixed(1)}ms)`);
	} else if (bestLatency < 50) {
		console.log(`  ✅ Good response times (${bestLatency.toFixed(1)}ms)`);
	} else {
		console.log(`  ⚠️  High latency detected (${bestLatency.toFixed(1)}ms)`);
	}

	if (totalErrors / totalRequests < 0.01) {
		console.log(`  ✅ Excellent reliability (${(totalErrors / totalRequests * 100).toFixed(3)}% error rate)`);
	} else if (totalErrors / totalRequests < 0.05) {
		console.log(`  ✅ Good reliability (${(totalErrors / totalRequests * 100).toFixed(2)}% error rate)`);
	} else {
		console.log(`  ⚠️  High error rate (${(totalErrors / totalRequests * 100).toFixed(2)}%)`);
	}
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Tenso Framework Load Testing Suite");
	console.log("=".repeat(50));
	console.log("This will run comprehensive load tests using autocannon");
	console.log("Tests include various load levels, request types, and stress scenarios\n");

	// Create and start the main test server
	const server = createTestServer();
	const startedServer = await startServer(server);

	console.log(`Test server started on port ${startedServer.server.address().port}`);

	const allResults = [];

	try {
		// Run all test suites
		const basicResults = await basicLoadTests(startedServer);
		allResults.push({ name: "Basic Tests", results: basicResults });

		const postResults = await postLoadTests(startedServer);
		allResults.push({ name: "POST Tests", results: postResults });

		const formatResults = await formatLoadTests(startedServer);
		allResults.push({ name: "Format Tests", results: formatResults });

		const rateLimitResults = await rateLimitLoadTests();
		allResults.push({ name: "Rate Limit", results: rateLimitResults });

		const paramResults = await parameterizedTests(startedServer);
		allResults.push({ name: "Parameterized", results: paramResults });

		const mixedResults = await mixedWorkloadTests(startedServer);
		allResults.push({ name: "Mixed Load", results: mixedResults });

		const hypermediaEnabledResults = await hypermediaEnabledTests();
		allResults.push({ name: "Hypermedia Enabled", results: hypermediaEnabledResults });

		const hypermediaDisabledResults = await hypermediaDisabledTests();
		allResults.push({ name: "Hypermedia Disabled", results: hypermediaDisabledResults });

		// Ask before running stress tests
		console.log("\n⚠️  Stress tests can be resource intensive.");
		console.log("Running stress tests automatically...\n");

		const stressResults = await stressTests(startedServer);
		allResults.push({ name: "Stress Tests", results: stressResults });

		// Generate summary report
		generateSummaryReport(allResults);

		console.log("\n✅ All load tests completed successfully!");

	} catch (error) {
		console.error("\n❌ Load test failed:", error);
		process.exit(1);
	} finally {
		// Clean up
		startedServer.stop();
		console.log("\nTest server stopped.");
	}
}

main();
