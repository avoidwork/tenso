#!/usr/bin/env node

/**
 * Memory usage benchmarks for Tenso framework
 */

import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

/**
 * Memory monitoring utilities
 */
class MemoryMonitor {
	constructor () {
		this.snapshots = [];
		this.gcEnabled = global.gc !== undefined;
	}

	/**
	 * Forces garbage collection if available
	 */
	forceGC () {
		if (this.gcEnabled) {
			global.gc();
		}
	}

	/**
	 * Takes a memory snapshot
	 */
	snapshot (label) {
		this.forceGC();
		const usage = process.memoryUsage();
		const snapshot = {
			label,
			timestamp: Date.now(),
			...usage
		};
		this.snapshots.push(snapshot);

		return snapshot;
	}

	/**
	 * Calculates memory difference between two snapshots
	 */
	diff (fromIndex, toIndex) {
		const from = this.snapshots[fromIndex];
		const to = this.snapshots[toIndex];

		return {
			rss: to.rss - from.rss,
			heapTotal: to.heapTotal - from.heapTotal,
			heapUsed: to.heapUsed - from.heapUsed,
			external: to.external - from.external,
			arrayBuffers: to.arrayBuffers - from.arrayBuffers
		};
	}

	/**
	 * Formats bytes to human readable format using IEC standard
	 */
	formatBytes (bytes) {
		return formatFilesize(bytes);
	}

	/**
	 * Prints memory usage report
	 */
	report () {
		console.log("\n📊 Memory Usage Report");
		console.log("-".repeat(50));

		this.snapshots.forEach((snapshot, index) => {
			console.log(`${index + 1}. ${snapshot.label}:`);
			console.log(`   RSS: ${this.formatBytes(snapshot.rss)}`);
			console.log(`   Heap Used: ${this.formatBytes(snapshot.heapUsed)}`);
			console.log(`   Heap Total: ${this.formatBytes(snapshot.heapTotal)}`);
			console.log(`   External: ${this.formatBytes(snapshot.external)}`);

			if (index > 0) {
				const diff = this.diff(index - 1, index);
				console.log("   Change from previous:");
				console.log(`     RSS: ${this.formatBytes(diff.rss)}`);
				console.log(`     Heap Used: ${this.formatBytes(diff.heapUsed)}`);
			}
			console.log("");
		});
	}

	/**
	 * Clears all snapshots
	 */
	clear () {
		this.snapshots = [];
	}
}

/**
 * Tests server creation and destruction memory usage
 */
async function testServerLifecycle () {
	console.log("🔥 Server Lifecycle Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	monitor.snapshot("Initial state");

	// Create multiple servers
	const servers = [];
	for (let i = 0; i < 10; i++) {
		const server = tenso({
			port: 0,
			silent: true,
			logging: { enabled: false },
			auth: { protect: [] },
			rate: { enabled: false },
			security: { csrf: false }
		});
		servers.push(server);
	}

	monitor.snapshot("After creating 10 servers");

	// Start servers
	for (const server of servers) {
		server.start();
	}

	monitor.snapshot("After starting servers");

	// Stop and cleanup servers
	for (const server of servers) {
		server.stop();
	}

	monitor.snapshot("After stopping servers");

	// Clear references
	servers.length = 0;

	monitor.snapshot("After clearing references");
	monitor.report();
}

/**
 * Tests request processing memory usage
 */
async function testRequestProcessing () {
	console.log("🔥 Request Processing Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({
		port: 0,
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		rate: { enabled: false },
		security: { csrf: false }
	});

	// Add test routes
	server.get("/test", (req, res) => {
		res.send({ message: "Hello World", timestamp: Date.now() });
	});

	server.post("/echo", (req, res) => {
		res.send(req.body);
	});

	monitor.snapshot("Server created");

	// Simulate request processing
	const requests = 1000;
	const testData = {
		users: Array.from({ length: 100 }, (_, i) => ({
			id: i,
			name: `User ${i}`,
			email: `user${i}@example.com`
		}))
	};

	monitor.snapshot("Before request simulation");

	for (let i = 0; i < requests; i++) {
		// Simulate request object
		const req = {
			method: "GET",
			url: "/test",
			headers: { accept: "application/json" },
			parsed: { searchParams: new URLSearchParams() },
			server: server,
			body: ""
		};

		// Simulate response object
		const res = {
			statusCode: 200,
			headers: {},
			getHeader: name => res.headers[name],
			removeHeader: name => delete res.headers[name],
			header: (name, value) => res.headers[name] = value, // eslint-disable-line no-return-assign
			getHeaders: () => res.headers
		};

		// Process request
		const result = server.render(req, res, testData); // eslint-disable-line no-unused-vars

		// Cleanup every 100 requests
		if (i % 100 === 0 && i > 0) {
			monitor.forceGC();
		}
	}

	monitor.snapshot(`After ${requests} requests`);
	monitor.report();
}

/**
 * Tests parser memory usage
 */
async function testParserMemory () {
	console.log("🔥 Parser Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({ silent: true, logging: { enabled: false } });
	const parsers = server.parsers;

	monitor.snapshot("Initial state");

	// Test JSON parser
	const jsonData = JSON.stringify({
		items: Array.from({ length: 1000 }, (_, i) => ({
			id: i,
			name: `Item ${i}`,
			data: { field1: `value${i}`, field2: Math.random() }
		}))
	});

	const jsonParser = parsers.get("application/json");
	for (let i = 0; i < 1000; i++) {
		jsonParser(jsonData);
	}

	monitor.snapshot("After JSON parsing (1000 iterations)");

	// Test JSONL parser
	const jsonlData = Array.from({ length: 500 }, (_, i) =>
		JSON.stringify({ id: i, name: `Item ${i}` })
	).join("\n");

	const jsonlParser = parsers.get("application/jsonl");
	for (let i = 0; i < 1000; i++) {
		jsonlParser(jsonlData);
	}

	monitor.snapshot("After JSONL parsing (1000 iterations)");

	// Test form parser
	const formData = Array.from({ length: 100 }, (_, i) =>
		`field${i}=value${i}&number${i}=${i}`
	).join("&");

	const formParser = parsers.get("application/x-www-form-urlencoded");
	for (let i = 0; i < 1000; i++) {
		formParser(formData);
	}

	monitor.snapshot("After form parsing (1000 iterations)");
	monitor.report();
}

/**
 * Tests renderer memory usage
 */
async function testRendererMemory () {
	console.log("🔥 Renderer Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({ silent: true, logging: { enabled: false } });
	const renderers = server.renderers;

	const testData = {
		items: Array.from({ length: 500 }, (_, i) => ({
			id: i,
			name: `Item ${i}`,
			description: `Description for item ${i}`,
			metadata: {
				created: new Date().toISOString(),
				tags: [`tag${i}`, "general"]
			}
		}))
	};

	monitor.snapshot("Initial state");

	// Test JSON renderer
	const jsonRenderer = renderers.get("application/json");
	const req = {
		headers: { accept: "application/json" },
		parsed: { searchParams: new URLSearchParams() },
		server: server
	};
	const res = {
		statusCode: 200,
		headers: {},
		getHeader: name => res.headers[name],
		removeHeader: name => delete res.headers[name],
		header: (name, value) => res.headers[name] = value, // eslint-disable-line no-return-assign
		getHeaders: () => res.headers
	};

	for (let i = 0; i < 1000; i++) {
		jsonRenderer(req, res, testData);
	}

	monitor.snapshot("After JSON rendering (1000 iterations)");

	// Test XML renderer
	const xmlRenderer = renderers.get("application/xml");
	for (let i = 0; i < 500; i++) {
		xmlRenderer(req, res, testData);
	}

	monitor.snapshot("After XML rendering (500 iterations)");

	// Test YAML renderer
	const yamlRenderer = renderers.get("application/yaml");
	for (let i = 0; i < 500; i++) {
		yamlRenderer(req, res, testData);
	}

	monitor.snapshot("After YAML rendering (500 iterations)");

	monitor.report();
}

/**
 * Tests rate limiting memory usage
 */
async function testRateLimitMemory () {
	console.log("🔥 Rate Limiting Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({
		silent: true,
		logging: { enabled: false },
		rate: {
			enabled: true,
			limit: 100,
			reset: 900
		}
	});

	monitor.snapshot("Initial state");

	// Simulate many different clients
	const clientCount = 10000;
	for (let i = 0; i < clientCount; i++) {
		const req = {
			sessionID: `client-${i}`,
			ip: `192.168.${Math.floor(i / 256)}.${i % 256}`
		};

		// Simulate rate limit check
		server.rateLimit(req);

		// Cleanup every 1000 clients
		if (i % 1000 === 0 && i > 0) {
			monitor.forceGC();
		}
	}

	monitor.snapshot(`After ${clientCount} rate limit checks`);

	// Simulate time passing and cleanup
	const rateStore = server.rates;
	const currentTime = Math.floor(Date.now() / 1000);

	// Mark many as expired
	let expiredCount = 0;
	for (const [key, value] of rateStore.entries()) { // eslint-disable-line no-unused-vars
		if (expiredCount < clientCount / 2) {
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

	monitor.snapshot(`After cleanup (${toDelete.length} removed)`);
	monitor.report();
}

/**
 * Tests memory leaks in long-running scenarios
 */
async function testMemoryLeaks () {
	console.log("🔥 Memory Leak Detection Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({
		port: 0,
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		rate: { enabled: true, limit: 1000 },
		security: { csrf: false }
	});

	server.get("/test", (req, res) => {
		res.send({
			data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() })),
			timestamp: Date.now()
		});
	});

	monitor.snapshot("Initial state");

	// Run multiple cycles to detect leaks
	const cycles = 5;
	const requestsPerCycle = 500;

	for (let cycle = 0; cycle < cycles; cycle++) {
		for (let i = 0; i < requestsPerCycle; i++) {
			const req = {
				method: "GET",
				url: "/test",
				headers: { accept: "application/json" },
				parsed: { searchParams: new URLSearchParams() },
				server: server,
				sessionID: `session-${cycle}-${i}`,
				ip: `192.168.1.${i % 255}`
			};

			const res = {
				statusCode: 200,
				headers: {},
				getHeader: name => res.headers[name],
				removeHeader: name => delete res.headers[name],
				header: (name, value) => res.headers[name] = value, // eslint-disable-line no-return-assign
				getHeaders: () => res.headers
			};

			// Simulate request processing
			server.render(req, res, { message: "test", cycle, iteration: i });
			server.rateLimit(req);
		}

		monitor.snapshot(`After cycle ${cycle + 1} (${requestsPerCycle} requests)`);
	}

	monitor.report();

	// Analyze for potential leaks
	console.log("\n🔍 Leak Analysis:");
	console.log("-".repeat(30));

	const baselineIndex = 1; // After first cycle
	let potentialLeak = false;

	for (let i = baselineIndex + 1; i < monitor.snapshots.length; i++) {
		const diff = monitor.diff(baselineIndex, i);
		const cycleNumber = i - baselineIndex + 1;

		console.log(`Cycle ${cycleNumber} vs Baseline:`);
		console.log(`  Heap Growth: ${monitor.formatBytes(diff.heapUsed)}`);

		// Check for consistent growth (potential leak)
		if (diff.heapUsed > 5 * 1024 * 1024) { // More than 5MB growth
			console.log("  ⚠️  Potential memory leak detected");
			potentialLeak = true;
		} else {
			console.log("  ✅ Memory usage stable");
		}
	}

	if (!potentialLeak) {
		console.log("\n✅ No memory leaks detected");
	} else {
		console.log("\n⚠️  Potential memory leaks found - investigate further");
	}
}

/**
 * Tests hypermedia memory usage
 */
async function testHypermediaMemory () {
	console.log("🔥 Hypermedia Memory Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();
	const server = tenso({
		silent: true,
		logging: { enabled: false },
		hypermedia: { enabled: true, header: true }
	});

	monitor.snapshot("Initial state");

	// Create test data with many linkable fields
	const testData = Array.from({ length: 1000 }, (_, i) => ({
		id: i,
		user_id: i + 1000,
		category_id: i % 10 + 1,
		related_ids: [i + 1, i + 2, i + 3],
		profile_url: `/users/${i + 1000}`,
		comments_url: `/posts/${i}/comments`,
		tags: [`tag${i % 20}`, `category${i % 10}`]
	}));

	// Process hypermedia for this data many times
	for (let i = 0; i < 100; i++) {
		const req = {
			method: "GET",
			url: "/api/posts",
			headers: { accept: "application/json" },
			parsed: {
				searchParams: new URLSearchParams("page=1&page_size=10"),
				href: "http://localhost/api/posts"
			},
			hypermedia: true,
			hypermediaHeader: true,
			server: server
		};

		const res = {
			statusCode: 200,
			headers: {},
			getHeader: name => res.headers[name],
			removeHeader: name => delete res.headers[name],
			header: (name, value) => res.headers[name] = value, // eslint-disable-line no-return-assign
			getHeaders: () => res.headers
		};

		// This would normally be called by the hypermedia middleware
		// We're simulating the link generation process
		const rep = { data: testData.slice(i * 10, (i + 1) * 10) };

		// Simulate hypermedia processing
		server.render(req, res, rep);

		if (i % 20 === 0) {
			monitor.forceGC();
		}
	}

	monitor.snapshot("After hypermedia processing (100 iterations)");
	monitor.report();
}

/**
 * Performance under memory pressure
 */
async function testMemoryPressure () {
	console.log("🔥 Memory Pressure Test");
	console.log("-".repeat(50));

	const monitor = new MemoryMonitor();

	monitor.snapshot("Initial state");

	// Create memory pressure
	const largeObjects = [];
	for (let i = 0; i < 100; i++) {
		largeObjects.push({
			id: i,
			data: new Array(10000).fill(0).map((_, j) => ({
				index: j,
				value: Math.random(),
				text: `Large text content for item ${i}-${j}`.repeat(10)
			}))
		});
	}

	monitor.snapshot("After creating memory pressure");

	// Now test server performance under pressure
	const server = tenso({
		silent: true,
		logging: { enabled: false },
		rate: { enabled: true, limit: 1000 }
	});

	server.get("/test", (req, res) => {
		res.send({ message: "Hello", data: largeObjects[0] }); // Reference large object
	});

	// Process requests under memory pressure
	for (let i = 0; i < 200; i++) {
		const req = {
			method: "GET",
			url: "/test",
			headers: { accept: "application/json" },
			parsed: { searchParams: new URLSearchParams() },
			server: server,
			sessionID: `pressure-session-${i}`
		};

		const res = {
			statusCode: 200,
			headers: {},
			getHeader: name => res.headers[name],
			removeHeader: name => delete res.headers[name],
			header: (name, value) => res.headers[name] = value, // eslint-disable-line no-return-assign
			getHeaders: () => res.headers
		};

		server.render(req, res, largeObjects[i % largeObjects.length]);
		server.rateLimit(req);
	}

	monitor.snapshot("After processing under memory pressure");

	// Cleanup pressure
	largeObjects.length = 0;
	monitor.forceGC();

	monitor.snapshot("After cleanup");
	monitor.report();
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Memory Usage Benchmarks for Tenso Framework");
	console.log("=".repeat(60));

	if (!global.gc) {
		console.log("⚠️  Note: Garbage collection not exposed. Run with --expose-gc for better results.\n");
	}

	try {
		await testServerLifecycle();
		await testRequestProcessing();
		await testParserMemory();
		await testRendererMemory();
		await testRateLimitMemory();
		await testHypermediaMemory();
		await testMemoryLeaks();
		await testMemoryPressure();

		console.log("\n✅ Memory benchmarks completed\n");
		console.log("💡 Tips for memory optimization:");
		console.log("   - Monitor for consistent memory growth patterns");
		console.log("   - Implement proper cleanup for expired rate limit entries");
		console.log("   - Consider object pooling for high-frequency operations");
		console.log("   - Use WeakMap/WeakSet where appropriate for caching");
		console.log("   - Profile with tools like --inspect or clinic.js for production\n");

	} catch (error) {
		console.error("❌ Memory benchmark failed:", error);
		process.exit(1);
	}
}

main();
