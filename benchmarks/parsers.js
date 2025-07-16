#!/usr/bin/env node

/**
 * Parser performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";

// Import parsers from the built distribution
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

// Create a server instance to access parsers
const server = tenso({ silent: true, logging: { enabled: false } });
const parsers = server.parsers;

/**
 * Test data for different parser types
 */
const testData = {
	json: {
		small: JSON.stringify({ id: 1, name: "test" }),
		medium: JSON.stringify({
			users: Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				email: `user${i}@example.com`,
				active: i % 2 === 0
			}))
		}),
		large: JSON.stringify({
			data: Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				title: `Item ${i}`,
				description: `This is a longer description for item ${i} with more text content`,
				metadata: {
					created: new Date().toISOString(),
					tags: [`tag${i}`, `category${i % 10}`, "general"],
					score: Math.random() * 100
				}
			}))
		})
	},
	jsonl: {
		small: '{"id":1,"name":"test"}',
		medium: Array.from({ length: 100 }, (_, i) =>
			JSON.stringify({ id: i, name: `User ${i}`, active: i % 2 === 0 })
		).join("\n"),
		large: Array.from({ length: 1000 }, (_, i) =>
			JSON.stringify({
				id: i,
				title: `Item ${i}`,
				timestamp: Date.now(),
				data: { field1: `value${i}`, field2: Math.random() }
			})
		).join("\n")
	},
	form: {
		small: "name=test&id=1",
		medium: Array.from({ length: 50 }, (_, i) =>
			`field${i}=value${i}&number${i}=${i}`
		).join("&"),
		large: Array.from({ length: 200 }, (_, i) =>
			`field${i}=This+is+a+longer+value+for+field+${i}&num${i}=${i}&bool${i}=${i % 2 === 0}`
		).join("&")
	}
};

/**
 * Benchmarks JSON parser performance
 */
function benchmarkJsonParser () {
	console.log("\n📊 JSON Parser Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const jsonParser = parsers.get("application/json");

	suite
		.add("JSON Parser - Small (2 fields)", () => {
			jsonParser(testData.json.small);
		})
		.add("JSON Parser - Medium (100 objects)", () => {
			jsonParser(testData.json.medium);
		})
		.add("JSON Parser - Large (1000 objects)", () => {
			jsonParser(testData.json.large);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks JSONL parser performance
 */
function benchmarkJsonlParser () {
	console.log("\n📊 JSONL Parser Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const jsonlParser = parsers.get("application/jsonl");

	suite
		.add("JSONL Parser - Small (1 line)", () => {
			jsonlParser(testData.jsonl.small);
		})
		.add("JSONL Parser - Medium (100 lines)", () => {
			jsonlParser(testData.jsonl.medium);
		})
		.add("JSONL Parser - Large (1000 lines)", () => {
			jsonlParser(testData.jsonl.large);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks form URL encoded parser performance
 */
function benchmarkFormParser () {
	console.log("\n📊 Form URL Encoded Parser Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const formParser = parsers.get("application/x-www-form-urlencoded");

	suite
		.add("Form Parser - Small (2 fields)", () => {
			formParser(testData.form.small);
		})
		.add("Form Parser - Medium (100 fields)", () => {
			formParser(testData.form.medium);
		})
		.add("Form Parser - Large (600 fields)", () => {
			formParser(testData.form.large);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Comparative parser benchmarks
 */
function benchmarkParserComparison () {
	console.log("\n📊 Parser Comparison (Medium datasets)");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const jsonParser = parsers.get("application/json");
	const jsonlParser = parsers.get("application/jsonl");
	const formParser = parsers.get("application/x-www-form-urlencoded");

	suite
		.add("JSON Parser (medium)", () => {
			jsonParser(testData.json.medium);
		})
		.add("JSONL Parser (medium)", () => {
			jsonlParser(testData.jsonl.medium);
		})
		.add("Form Parser (medium)", () => {
			formParser(testData.form.medium);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
			console.log(`  Slowest: ${this.filter("slowest").map("name")}`);
		})
		.run();
}

/**
 * Memory usage test for parsers
 */
function testParserMemoryUsage () {
	console.log("\n📊 Parser Memory Usage");
	console.log("-".repeat(40));

	const jsonParser = parsers.get("application/json");
	const jsonlParser = parsers.get("application/jsonl");
	const formParser = parsers.get("application/x-www-form-urlencoded");

	// Test with large datasets
	const iterations = 1000;

	// JSON test
	const jsonStart = process.memoryUsage();
	for (let i = 0; i < iterations; i++) {
		jsonParser(testData.json.large);
	}
	const jsonEnd = process.memoryUsage();

	// JSONL test
	const jsonlStart = process.memoryUsage();
	for (let i = 0; i < iterations; i++) {
		jsonlParser(testData.jsonl.large);
	}
	const jsonlEnd = process.memoryUsage();

	// Form test
	const formStart = process.memoryUsage();
	for (let i = 0; i < iterations; i++) {
		formParser(testData.form.large);
	}
	const formEnd = process.memoryUsage();

	console.log(`JSON Parser (${iterations} iterations):`);
	const jsonDiff = jsonEnd.heapUsed - jsonStart.heapUsed;
	console.log(`  Heap Used: ${jsonDiff >= 0 ? "+" : ""}${formatFilesize(jsonDiff)}`);

	console.log(`JSONL Parser (${iterations} iterations):`);
	const jsonlDiff = jsonlEnd.heapUsed - jsonlStart.heapUsed;
	console.log(`  Heap Used: ${jsonlDiff >= 0 ? "+" : ""}${formatFilesize(jsonlDiff)}`);

	console.log(`Form Parser (${iterations} iterations):`);
	const formDiff = formEnd.heapUsed - formStart.heapUsed;
	console.log(`  Heap Used: ${formDiff >= 0 ? "+" : ""}${formatFilesize(formDiff)}`);
	console.log("  Note: Negative values indicate garbage collection occurred during test");
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Parser Performance Benchmarks");

	try {
		benchmarkJsonParser();
		benchmarkJsonlParser();
		benchmarkFormParser();
		benchmarkParserComparison();
		testParserMemoryUsage();

		console.log("\n✅ Parser benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
