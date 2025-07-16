#!/usr/bin/env node

/**
 * Basic HTTP performance benchmarks for Tenso framework
 */

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { tenso } from "../dist/tenso.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // eslint-disable-line no-unused-vars

/**
 * Creates a simple test server for benchmarking
 * @returns {Object} Tenso server instance
 */
function createTestServer () {
	const server = tenso({
		port: 0, // Use random available port
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		rate: { enabled: false },
		security: { csrf: false }
	});

	// Basic routes for testing
	server.get("/test", (req, res) => {
		res.send("Hello World");
	});

	server.get("/json", (req, res) => {
		res.send({ message: "Hello JSON", timestamp: Date.now() });
	});

	server.get("/large-json", (req, res) => {
		const data = {
			items: Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				name: `Item ${i}`,
				description: `This is item number ${i}`,
				timestamp: Date.now(),
				data: {
					field1: `value_${i}`,
					field2: Math.random(),
					field3: i % 2 === 0
				}
			}))
		};
		res.send(data);
	});

	server.post("/echo", (req, res) => {
		res.send(req.body);
	});

	return server;
}

/**
 * Tests basic request/response cycle performance
 */
function testRequestResponse () {
	return new Promise(resolve => {
		const iterations = 10000;
		const server = createTestServer();

		server.start();

		// Wait for server to be listening before accessing address
		server.server.on("listening", () => {
			const port = server.server.address().port; // eslint-disable-line no-unused-vars

			console.log("\n📊 Basic Request/Response Performance");
			console.log("-".repeat(40));

			const startTime = process.hrtime.bigint();
			let completed = 0;

			// Simple simulation of request processing
			for (let i = 0; i < iterations; i++) {
				// Simulate request object
				const req = {
					method: "GET",
					url: "/test",
					headers: { "accept": "text/plain" },
					parsed: new URL("http://localhost/test"),
					server: server
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

				// Simulate response processing
				const body = server.render(req, res, "Hello World"); // eslint-disable-line no-unused-vars

				if (++completed === iterations) {
					const endTime = process.hrtime.bigint();
					const duration = Number(endTime - startTime) / 1e6; // Convert to ms
					const rps = Math.round(iterations / duration * 1000);

					console.log(`Iterations: ${iterations.toLocaleString()}`);
					console.log(`Duration: ${duration.toFixed(2)}ms`);
					console.log(`Rate: ${rps.toLocaleString()} requests/second`);
					console.log(`Avg: ${(duration / iterations).toFixed(4)}ms per request`);

					server.stop();
					resolve();
				}
			}
		});
	});
}

/**
 * Tests JSON serialization performance
 */
function testJsonSerialization () {
	console.log("\n📊 JSON Serialization Performance");
	console.log("-".repeat(40));

	const server = createTestServer();
	const iterations = 50000;
	const testData = {
		id: 12345,
		name: "Test Object",
		items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item_${i}` })),
		metadata: {
			created: new Date().toISOString(),
			version: "1.0.0"
		}
	};

	const req = {
		method: "GET",
		headers: { "accept": "application/json" },
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

	const startTime = process.hrtime.bigint();

	for (let i = 0; i < iterations; i++) {
		server.render(req, res, testData);
	}

	const endTime = process.hrtime.bigint();
	const duration = Number(endTime - startTime) / 1e6;
	const rps = Math.round(iterations / duration * 1000);

	console.log(`Iterations: ${iterations.toLocaleString()}`);
	console.log(`Duration: ${duration.toFixed(2)}ms`);
	console.log(`Rate: ${rps.toLocaleString()} serializations/second`);
	console.log(`Avg: ${(duration / iterations).toFixed(4)}ms per serialization`);
}

/**
 * Main execution
 */
async function main () {
	console.log("🔥 Basic HTTP Performance Benchmarks");

	try {
		await testRequestResponse();
		testJsonSerialization();

		console.log("\n✅ Basic HTTP benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
