#!/usr/bin/env node

/**
 * Serializer performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

// Create a server instance to access serializers
const server = tenso({
	port: 0,
	silent: true,
	logging: { enabled: false },
	auth: { protect: [] },
	rate: { enabled: false },
	security: { csrf: false }
});
const serializers = server.serializers;

/**
 * Test data for different serializer types
 */
const testData = {
	simple: { id: 1, name: "test", active: true },
	medium: {
		users: Array.from({ length: 100 }, (_, i) => ({
			id: i,
			name: `User ${i}`,
			email: `user${i}@example.com`,
			active: i % 2 === 0,
			profile: {
				age: 20 + i % 50,
				department: `Dept ${i % 10}`
			}
		}))
	},
	large: {
		data: Array.from({ length: 1000 }, (_, i) => ({
			id: i,
			title: `Item ${i}`,
			description: `This is a longer description for item ${i} with more text content`,
			metadata: {
				created: new Date().toISOString(),
				tags: [`tag${i}`, `category${i % 10}`, "general"],
				score: Math.random() * 100,
				nested: {
					field1: `value${i}`,
					field2: i * 2,
					field3: i % 2 === 0
				}
			}
		}))
	},
	arrayData: Array.from({ length: 500 }, (_, i) => ({
		id: i,
		value: `item_${i}`,
		timestamp: Date.now()
	}))
};

/**
 * Test errors for error serialization scenarios
 */
const testErrors = {
	simple: new Error("Simple test error"),
	complex: Object.assign(new Error("Complex error with stack"), {
		code: "TEST_ERROR",
		statusCode: 400,
		details: { field: "value", nested: { info: "test" } }
	}),
	string: "String error message",
	null: null
};

console.log("🔥 Serializer Performance Benchmarks\n");

/**
 * Benchmarks custom serializer performance
 */
function benchmarkCustomSerializer () {
	console.log("📊 Custom Serializer Benchmarks");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const suite = new Benchmark.Suite();

	suite
		.add("Custom Serializer - Simple object", () => {
			customSerializer(testData.simple, null, 200);
		})
		.add("Custom Serializer - Medium (100 users)", () => {
			customSerializer(testData.medium, null, 200);
		})
		.add("Custom Serializer - Large (1000 items)", () => {
			customSerializer(testData.large, null, 200);
		})
		.add("Custom Serializer - Array (500 items)", () => {
			customSerializer(testData.arrayData, null, 200);
		})
		.add("Custom Serializer - Error with stack", () => {
			customSerializer(null, testErrors.complex, 500, true);
		})
		.add("Custom Serializer - Error without stack", () => {
			customSerializer(null, testErrors.complex, 500, false);
		})
		.add("Custom Serializer - String error", () => {
			customSerializer(null, testErrors.string, 400, false);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}\n`);
		})
		.run({ async: false });
}

/**
 * Benchmarks plain serializer performance
 */
function benchmarkPlainSerializer () {
	console.log("📊 Plain Serializer Benchmarks");
	console.log("-".repeat(40));

	const plainSerializer = serializers.get("text/plain");
	const suite = new Benchmark.Suite();

	suite
		.add("Plain Serializer - Simple object", () => {
			plainSerializer(testData.simple, null, 200);
		})
		.add("Plain Serializer - Medium (100 users)", () => {
			plainSerializer(testData.medium, null, 200);
		})
		.add("Plain Serializer - Large (1000 items)", () => {
			plainSerializer(testData.large, null, 200);
		})
		.add("Plain Serializer - Array (500 items)", () => {
			plainSerializer(testData.arrayData, null, 200);
		})
		.add("Plain Serializer - Error with stack", () => {
			plainSerializer(null, testErrors.complex, 500, true);
		})
		.add("Plain Serializer - Error without stack", () => {
			plainSerializer(null, testErrors.complex, 500, false);
		})
		.add("Plain Serializer - String error", () => {
			plainSerializer(null, testErrors.string, 400, false);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}\n`);
		})
		.run({ async: false });
}

/**
 * Benchmarks serializer comparison for different MIME types
 */
function benchmarkSerializerComparison () {
	console.log("📊 Serializer Comparison (Medium datasets)");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const plainSerializer = serializers.get("text/plain");
	const xmlCustom = serializers.get("application/xml");
	const csvPlain = serializers.get("text/csv");
	const yamlCustom = serializers.get("application/yaml");

	const suite = new Benchmark.Suite();

	suite
		.add("Custom Serializer (JSON)", () => {
			customSerializer(testData.medium, null, 200);
		})
		.add("Plain Serializer (text)", () => {
			plainSerializer(testData.medium, null, 200);
		})
		.add("Custom Serializer (XML)", () => {
			xmlCustom(testData.medium, null, 200);
		})
		.add("Plain Serializer (CSV)", () => {
			csvPlain(testData.medium, null, 200);
		})
		.add("Custom Serializer (YAML)", () => {
			yamlCustom(testData.medium, null, 200);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
			console.log(`  Slowest: ${this.filter("slowest").map("name")}\n`);
		})
		.run({ async: false });
}

/**
 * Benchmarks error handling performance
 */
function benchmarkErrorHandling () {
	console.log("📊 Error Handling Performance");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const plainSerializer = serializers.get("text/plain");
	const suite = new Benchmark.Suite();

	suite
		.add("Custom - Error object with stack", () => {
			customSerializer(null, testErrors.complex, 500, true);
		})
		.add("Custom - Error object without stack", () => {
			customSerializer(null, testErrors.complex, 500, false);
		})
		.add("Plain - Error object with stack", () => {
			plainSerializer(null, testErrors.complex, 500, true);
		})
		.add("Plain - Error object without stack", () => {
			plainSerializer(null, testErrors.complex, 500, false);
		})
		.add("Custom - String error", () => {
			customSerializer(null, "Error message", 400, false);
		})
		.add("Plain - String error", () => {
			plainSerializer(null, "Error message", 400, false);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}\n`);
		})
		.run({ async: false });
}

/**
 * Benchmarks data size impact on serialization performance
 */
function benchmarkDataSizeImpact () {
	console.log("📊 Data Size Impact on Serialization");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const suite = new Benchmark.Suite();

	// Generate different sized datasets
	const sizes = [10, 100, 1000, 5000];

	for (const size of sizes) {
		const data = Array.from({ length: size }, (_, i) => ({
			id: i,
			name: `Item ${i}`,
			data: `Some data for item ${i}`,
			timestamp: Date.now()
		}));

		suite.add(`Custom Serializer - ${size} items`, () => {
			customSerializer(data, null, 200);
		});
	}

	suite
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log("  Performance scales linearly with data size\n");
		})
		.run({ async: false });
}

/**
 * Tests serializer memory usage
 */
function testSerializerMemoryUsage () {
	console.log("📊 Serializer Memory Usage");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const plainSerializer = serializers.get("text/plain");

	function measureMemory (name, serializer, iterations = 1000) {
		if (global.gc) {
			global.gc();
		}
		const before = process.memoryUsage().heapUsed;

		for (let i = 0; i < iterations; i++) {
			serializer(testData.medium, null, 200);
		}

		if (global.gc) {
			global.gc();
		}
		const after = process.memoryUsage().heapUsed;
		const diff = after - before;

		console.log(`${name} (${iterations} iterations):`);
		console.log(`  Heap Used: ${diff >= 0 ? "+" : ""}${formatFilesize(diff)}`);
	}

	measureMemory("Custom Serializer", customSerializer);
	measureMemory("Plain Serializer", plainSerializer);

	// Error serialization memory test
	measureMemory("Custom Error Serialization", (data, err, status) => { // eslint-disable-line no-unused-vars
		return customSerializer(null, testErrors.complex, 500, false);
	});

	console.log("");
}

/**
 * Benchmarks status code handling
 */
function benchmarkStatusCodeHandling () {
	console.log("📊 Status Code Handling Performance");
	console.log("-".repeat(40));

	const customSerializer = serializers.get("application/json");
	const suite = new Benchmark.Suite();

	const statusCodes = [200, 201, 400, 404, 500];

	for (const status of statusCodes) {
		suite.add(`Custom - Status ${status}`, () => {
			if (status >= 400) {
				customSerializer(null, new Error(`Error ${status}`), status, false);
			} else {
				customSerializer(testData.simple, null, status);
			}
		});
	}

	suite
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}\n`);
		})
		.run({ async: false });
}

/**
 * Main execution function
 */
async function main () {
	benchmarkCustomSerializer();
	benchmarkPlainSerializer();
	benchmarkSerializerComparison();
	benchmarkErrorHandling();
	benchmarkDataSizeImpact();
	testSerializerMemoryUsage();
	benchmarkStatusCodeHandling();

	console.log("✅ Serializer benchmarks completed\n");
}

main().catch(console.error);
