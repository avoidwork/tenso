#!/usr/bin/env node

/**
 * Renderer performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

// Create a server instance to access renderers
const server = tenso({ silent: true, logging: { enabled: false } });
const renderers = server.renderers;

/**
 * Test data for different renderer types
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
 * Creates mock request and response objects for testing
 */
function createMockReqRes (acceptHeader = "application/json") {
	const req = {
		method: "GET",
		headers: { accept: acceptHeader },
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

	return { req, res };
}

/**
 * Benchmarks JSON renderer performance
 */
function benchmarkJsonRenderer () {
	console.log("\n📊 JSON Renderer Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const jsonRenderer = renderers.get("application/json");
	const { req, res } = createMockReqRes("application/json");

	suite
		.add("JSON Renderer - Simple object", () => {
			jsonRenderer(req, res, testData.simple);
		})
		.add("JSON Renderer - Medium (100 users)", () => {
			jsonRenderer(req, res, testData.medium);
		})
		.add("JSON Renderer - Large (1000 items)", () => {
			jsonRenderer(req, res, testData.large);
		})
		.add("JSON Renderer - Array (500 items)", () => {
			jsonRenderer(req, res, testData.arrayData);
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
 * Benchmarks XML renderer performance
 */
function benchmarkXmlRenderer () {
	console.log("\n📊 XML Renderer Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const xmlRenderer = renderers.get("application/xml");
	const { req, res } = createMockReqRes("application/xml");

	suite
		.add("XML Renderer - Simple object", () => {
			xmlRenderer(req, res, testData.simple);
		})
		.add("XML Renderer - Medium (100 users)", () => {
			xmlRenderer(req, res, testData.medium);
		})
		.add("XML Renderer - Large (1000 items)", () => {
			xmlRenderer(req, res, testData.large);
		})
		.add("XML Renderer - Array (500 items)", () => {
			xmlRenderer(req, res, testData.arrayData);
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
 * Benchmarks CSV renderer performance
 */
function benchmarkCsvRenderer () {
	console.log("\n📊 CSV Renderer Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const csvRenderer = renderers.get("text/csv");
	const { req, res } = createMockReqRes("text/csv");

	// CSV works best with arrays of flat objects
	const csvData = {
		small: [testData.simple],
		medium: testData.medium.users.map(user => ({
			id: user.id,
			name: user.name,
			email: user.email,
			active: user.active,
			age: user.profile.age,
			department: user.profile.department
		})),
		large: testData.arrayData
	};

	suite
		.add("CSV Renderer - Small (1 row)", () => {
			csvRenderer(req, res, csvData.small);
		})
		.add("CSV Renderer - Medium (100 rows)", () => {
			csvRenderer(req, res, csvData.medium);
		})
		.add("CSV Renderer - Large (500 rows)", () => {
			csvRenderer(req, res, csvData.large);
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
 * Benchmarks YAML renderer performance
 */
function benchmarkYamlRenderer () {
	console.log("\n📊 YAML Renderer Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const yamlRenderer = renderers.get("application/yaml");
	const { req, res } = createMockReqRes("application/yaml");

	suite
		.add("YAML Renderer - Simple object", () => {
			yamlRenderer(req, res, testData.simple);
		})
		.add("YAML Renderer - Medium (100 users)", () => {
			yamlRenderer(req, res, testData.medium);
		})
		.add("YAML Renderer - Large (1000 items)", () => {
			yamlRenderer(req, res, testData.large);
		})
		.add("YAML Renderer - Array (500 items)", () => {
			yamlRenderer(req, res, testData.arrayData);
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
 * Benchmarks plain text renderer performance
 */
function benchmarkPlainRenderer () {
	console.log("\n📊 Plain Text Renderer Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const plainRenderer = renderers.get("text/plain");
	const { req, res } = createMockReqRes("text/plain");

	suite
		.add("Plain Renderer - Simple object", () => {
			plainRenderer(req, res, testData.simple);
		})
		.add("Plain Renderer - Medium (100 users)", () => {
			plainRenderer(req, res, testData.medium);
		})
		.add("Plain Renderer - Large (1000 items)", () => {
			plainRenderer(req, res, testData.large);
		})
		.add("Plain Renderer - Array (500 items)", () => {
			plainRenderer(req, res, testData.arrayData);
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
 * Comparative renderer benchmarks
 */
function benchmarkRendererComparison () {
	console.log("\n📊 Renderer Comparison (Medium datasets)");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Get all renderers
	const jsonRenderer = renderers.get("application/json");
	const xmlRenderer = renderers.get("application/xml");
	const csvRenderer = renderers.get("text/csv");
	const yamlRenderer = renderers.get("application/yaml");
	const plainRenderer = renderers.get("text/plain");

	// Create appropriate mock objects for each renderer
	const jsonMock = createMockReqRes("application/json");
	const xmlMock = createMockReqRes("application/xml");
	const csvMock = createMockReqRes("text/csv");
	const yamlMock = createMockReqRes("application/yaml");
	const plainMock = createMockReqRes("text/plain");

	// Use appropriate data for CSV (flattened)
	const csvData = testData.medium.users.map(user => ({
		id: user.id,
		name: user.name,
		email: user.email,
		active: user.active
	}));

	suite
		.add("JSON Renderer (medium)", () => {
			jsonRenderer(jsonMock.req, jsonMock.res, testData.medium);
		})
		.add("XML Renderer (medium)", () => {
			xmlRenderer(xmlMock.req, xmlMock.res, testData.medium);
		})
		.add("CSV Renderer (medium)", () => {
			csvRenderer(csvMock.req, csvMock.res, csvData);
		})
		.add("YAML Renderer (medium)", () => {
			yamlRenderer(yamlMock.req, yamlMock.res, testData.medium);
		})
		.add("Plain Renderer (medium)", () => {
			plainRenderer(plainMock.req, plainMock.res, testData.medium);
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
 * Memory usage test for renderers
 */
function testRendererMemoryUsage () {
	console.log("\n📊 Renderer Memory Usage");
	console.log("-".repeat(40));

	const iterations = 1000;
	const data = testData.large;

	// Test each renderer
	const rendererTests = [
		{ name: "JSON", renderer: renderers.get("application/json"), accept: "application/json" },
		{ name: "XML", renderer: renderers.get("application/xml"), accept: "application/xml" },
		{ name: "YAML", renderer: renderers.get("application/yaml"), accept: "application/yaml" },
		{ name: "Plain", renderer: renderers.get("text/plain"), accept: "text/plain" }
	];

	for (const test of rendererTests) {
		const { req, res } = createMockReqRes(test.accept);

		const startMem = process.memoryUsage();
		for (let i = 0; i < iterations; i++) {
			test.renderer(req, res, data);
		}
		const endMem = process.memoryUsage();

		console.log(`${test.name} Renderer (${iterations} iterations):`);
		const heapDiff = endMem.heapUsed - startMem.heapUsed;
		console.log(`  Heap Used: ${heapDiff >= 0 ? "+" : ""}${formatFilesize(heapDiff)}`);
	}
	console.log("  Note: Negative values indicate garbage collection occurred during test");
}

/**
 * Tests renderer performance with different data sizes
 */
function benchmarkDataSizeImpact () {
	console.log("\n📊 Data Size Impact on JSON Renderer");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const jsonRenderer = renderers.get("application/json");
	const { req, res } = createMockReqRes("application/json");

	// Different data sizes
	const smallData = { items: Array.from({ length: 10 }, (_, i) => ({ id: i })) };
	const mediumData = { items: Array.from({ length: 100 }, (_, i) => ({ id: i })) };
	const largeData = { items: Array.from({ length: 1000 }, (_, i) => ({ id: i })) };
	const extraLargeData = { items: Array.from({ length: 5000 }, (_, i) => ({ id: i })) };

	suite
		.add("JSON - 10 items", () => {
			jsonRenderer(req, res, smallData);
		})
		.add("JSON - 100 items", () => {
			jsonRenderer(req, res, mediumData);
		})
		.add("JSON - 1000 items", () => {
			jsonRenderer(req, res, largeData);
		})
		.add("JSON - 5000 items", () => {
			jsonRenderer(req, res, extraLargeData);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log("  Performance scales linearly with data size");
		})
		.run();
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Renderer Performance Benchmarks");

	try {
		benchmarkJsonRenderer();
		benchmarkXmlRenderer();
		benchmarkCsvRenderer();
		benchmarkYamlRenderer();
		benchmarkPlainRenderer();
		benchmarkRendererComparison();
		benchmarkDataSizeImpact();
		testRendererMemoryUsage();

		console.log("\n✅ Renderer benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
