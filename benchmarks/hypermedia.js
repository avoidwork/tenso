#!/usr/bin/env node

/**
 * Hypermedia performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

/**
 * Creates a test server with hypermedia enabled
 */
function createHypermediaServer () { // eslint-disable-line no-unused-vars
	return tenso({
		port: 0,
		silent: true,
		logging: { enabled: false },
		auth: { protect: [] },
		rate: { enabled: false },
		security: { csrf: false },
		hypermedia: {
			enabled: true,
			header: true
		},
		pageSize: 10
	});
}

/**
 * Creates mock request objects for testing
 */
function createMockRequest (options = {}) {
	return {
		method: options.method || "GET",
		url: options.url || "/api/users",
		headers: options.headers || { accept: "application/json" },
		parsed: {
			pathname: options.url || "/api/users",
			href: `http://localhost${options.url || "/api/users"}`,
			protocol: "http:",
			search: options.search || "",
			searchParams: new URLSearchParams(options.search || "")
		},
		hypermedia: true,
		hypermediaHeader: true,
		server: null // Will be set later
	};
}

/**
 * Creates mock response objects for testing
 */
function createMockResponse () {
	return {
		statusCode: 200,
		headers: {},
		getHeader: function (name) { return this.headers[name]; },
		removeHeader: function (name) { delete this.headers[name]; },
		header: function (name, value) { this.headers[name] = value; },
		getHeaders: function () { return this.headers; }
	};
}

/**
 * Creates test data for hypermedia testing
 */
function createTestData () {
	return {
		simple: {
			id: 1,
			name: "John Doe",
			user_id: 123,
			profile_url: "/users/123"
		},
		collection: Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			name: `User ${i + 1}`,
			email: `user${i + 1}@example.com`,
			user_id: i + 1,
			profile_url: `/users/${i + 1}`,
			posts_url: `/users/${i + 1}/posts`
		})),
		nested: {
			id: 1,
			title: "Blog Post",
			author_id: 123,
			category_id: 456,
			tags: ["tech", "javascript", "performance"],
			related_posts: [2, 3, 4],
			comments_url: "/posts/1/comments",
			author_url: "/users/123"
		},
		largeCollection: Array.from({ length: 1000 }, (_, i) => ({
			id: i + 1,
			name: `Item ${i + 1}`,
			category_id: i % 10 + 1,
			related_items: [(i + 1) % 1000, (i + 2) % 1000],
			item_url: `/items/${i + 1}`
		}))
	};
}

/**
 * Mock hypermedia link generation function
 */
function generateHypermediaLinks (data, baseUrl, seen = new Set()) {
	const links = [];

	if (!data || typeof data !== "object") {
		return links;
	}

	// Process arrays
	if (Array.isArray(data)) {
		for (const item of data) {
			links.push(...generateHypermediaLinks(item, baseUrl, seen));
		}

		return links;
	}

	// Process objects
	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "string" || typeof value === "number") {
			// Check for ID-like patterns
			if ((/(_)?ids?$/).test(key) && !seen.has(value)) {
				const resourceType = key.replace(/(_)?ids?$/, "s");
				const uri = `/${resourceType}/${value}`;
				if (!seen.has(uri)) {
					links.push({ uri, rel: "related" });
					seen.add(uri);
				}
			}

			// Check for URL patterns
			if ((/urls?$/).test(key) && typeof value === "string" && value.startsWith("/")) {
				if (!seen.has(value)) {
					links.push({ uri: value, rel: "related" });
					seen.add(value);
				}
			}
		} else if (Array.isArray(value)) {
			// Process arrays of IDs
			if ((/(_)?ids?$/).test(key)) {
				const resourceType = key.replace(/(_)?ids?$/, "s");
				for (const id of value) {
					const uri = `/${resourceType}/${id}`;
					if (!seen.has(uri)) {
						links.push({ uri, rel: "related" });
						seen.add(uri);
					}
				}
			}
		}
	}

	return links;
}

/**
 * Mock pagination link generation
 */
function generatePaginationLinks (totalItems, currentPage, pageSize, baseUrl) {
	const links = [];
	const totalPages = Math.ceil(totalItems / pageSize);

	if (currentPage > 1) {
		links.push({ uri: `${baseUrl}?page=1&page_size=${pageSize}`, rel: "first" });
		links.push({ uri: `${baseUrl}?page=${currentPage - 1}&page_size=${pageSize}`, rel: "prev" });
	}

	if (currentPage < totalPages) {
		links.push({ uri: `${baseUrl}?page=${currentPage + 1}&page_size=${pageSize}`, rel: "next" });
		links.push({ uri: `${baseUrl}?page=${totalPages}&page_size=${pageSize}`, rel: "last" });
	}

	return links;
}

/**
 * Benchmarks basic hypermedia link generation
 */
function benchmarkBasicLinkGeneration () {
	console.log("\n📊 Basic Hypermedia Link Generation");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const testData = createTestData();

	suite
		.add("Link generation - Simple object", () => {
			generateHypermediaLinks(testData.simple, "/api");
		})
		.add("Link generation - Nested object", () => {
			generateHypermediaLinks(testData.nested, "/api");
		})
		.add("Link generation - Small collection (100 items)", () => {
			generateHypermediaLinks(testData.collection, "/api");
		})
		.add("Link generation - Large collection (1000 items)", () => {
			generateHypermediaLinks(testData.largeCollection, "/api");
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
 * Benchmarks pagination link generation
 */
function benchmarkPaginationLinks () {
	console.log("\n📊 Pagination Link Generation");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	suite
		.add("Pagination - Small dataset (100 items, page 1)", () => {
			generatePaginationLinks(100, 1, 10, "/api/users");
		})
		.add("Pagination - Small dataset (100 items, page 5)", () => {
			generatePaginationLinks(100, 5, 10, "/api/users");
		})
		.add("Pagination - Medium dataset (1000 items, page 25)", () => {
			generatePaginationLinks(1000, 25, 20, "/api/posts");
		})
		.add("Pagination - Large dataset (10000 items, page 100)", () => {
			generatePaginationLinks(10000, 100, 50, "/api/items");
		})
		.add("Pagination - Batch generation (100 pages)", () => {
			for (let i = 1; i <= 100; i++) {
				generatePaginationLinks(1000, i, 10, "/api/data");
			}
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
 * Benchmarks ID pattern matching performance
 */
function benchmarkIdPatternMatching () {
	console.log("\n📊 ID Pattern Matching Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Different field names to test pattern matching
	const fieldNames = [
		"id", "user_id", "category_id", "post_id", "comment_id",
		"ids", "user_ids", "tag_ids", "related_ids",
		"name", "title", "description", "content",
		"url", "user_url", "profile_url", "api_url",
		"urls", "image_urls", "link_urls"
	];

	const idPattern = /(_)?ids?$/;
	const urlPattern = /urls?$/;

	suite
		.add("ID Pattern - Single field check", () => {
			idPattern.test("user_id");
		})
		.add("ID Pattern - Multiple field checks", () => {
			fieldNames.forEach(field => idPattern.test(field));
		})
		.add("URL Pattern - Single field check", () => {
			urlPattern.test("profile_url");
		})
		.add("URL Pattern - Multiple field checks", () => {
			fieldNames.forEach(field => urlPattern.test(field));
		})
		.add("Combined Pattern - Field categorization", () => {
			fieldNames.forEach(field => {
				if (idPattern.test(field)) {
					// ID field
				} else if (urlPattern.test(field)) {
					// URL field
				} else {
					// Regular field
				}
			});
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
 * Benchmarks link deduplication performance
 */
function benchmarkLinkDeduplication () {
	console.log("\n📊 Link Deduplication Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Generate test links with duplicates
	const generateLinksWithDuplicates = count => {
		const links = [];
		for (let i = 0; i < count; i++) {
			// Create some duplicates
			const id = i % (count / 2);
			links.push({ uri: `/users/${id}`, rel: "related" });
			links.push({ uri: `/posts/${id}`, rel: "related" });
		}

		return links;
	};

	const deduplicateWithSet = links => {
		const seen = new Set();

		return links.filter(link => {
			if (seen.has(link.uri)) {
				return false;
			}
			seen.add(link.uri);

			return true;
		});
	};

	const deduplicateWithMap = links => {
		const seen = new Map();

		return links.filter(link => {
			if (seen.has(link.uri)) {
				return false;
			}
			seen.set(link.uri, true);

			return true;
		});
	};

	const small = generateLinksWithDuplicates(100);
	const medium = generateLinksWithDuplicates(500);
	const large = generateLinksWithDuplicates(2000);

	suite
		.add("Deduplication Set - Small (100 links)", () => {
			deduplicateWithSet([...small]);
		})
		.add("Deduplication Map - Small (100 links)", () => {
			deduplicateWithMap([...small]);
		})
		.add("Deduplication Set - Medium (500 links)", () => {
			deduplicateWithSet([...medium]);
		})
		.add("Deduplication Map - Medium (500 links)", () => {
			deduplicateWithMap([...medium]);
		})
		.add("Deduplication Set - Large (2000 links)", () => {
			deduplicateWithSet([...large]);
		})
		.add("Deduplication Map - Large (2000 links)", () => {
			deduplicateWithMap([...large]);
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
 * Benchmarks link header generation
 */
function benchmarkLinkHeaderGeneration () {
	console.log("\n📊 Link Header Generation Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	const generateLinkHeader = links => {
		return links.map(link => `<${link.uri}>; rel="${link.rel}"`).join(", ");
	};

	const generateSortedLinkHeader = links => {
		const sorted = [...links].sort((a, b) => {
			if (a.rel !== b.rel) return a.rel.localeCompare(b.rel);

			return a.uri.localeCompare(b.uri);
		});

		return generateLinkHeader(sorted);
	};

	// Generate test link sets
	const smallLinks = Array.from({ length: 5 }, (_, i) => ({
		uri: `/resource/${i}`,
		rel: ["self", "next", "prev", "related", "edit"][i % 5]
	}));

	const mediumLinks = Array.from({ length: 20 }, (_, i) => ({
		uri: `/resource/${i}`,
		rel: ["self", "next", "prev", "related", "edit"][i % 5]
	}));

	const largeLinks = Array.from({ length: 50 }, (_, i) => ({
		uri: `/resource/${i}`,
		rel: ["self", "next", "prev", "related", "edit"][i % 5]
	}));

	suite
		.add("Link Header - Small (5 links)", () => {
			generateLinkHeader(smallLinks);
		})
		.add("Link Header Sorted - Small (5 links)", () => {
			generateSortedLinkHeader(smallLinks);
		})
		.add("Link Header - Medium (20 links)", () => {
			generateLinkHeader(mediumLinks);
		})
		.add("Link Header Sorted - Medium (20 links)", () => {
			generateSortedLinkHeader(mediumLinks);
		})
		.add("Link Header - Large (50 links)", () => {
			generateLinkHeader(largeLinks);
		})
		.add("Link Header Sorted - Large (50 links)", () => {
			generateSortedLinkHeader(largeLinks);
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
 * Benchmarks complete hypermedia processing pipeline
 */
function benchmarkHypermediaPipeline () {
	console.log("\n📊 Complete Hypermedia Pipeline");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();
	const testData = createTestData();

	const processHypermedia = (data, req, res) => {
		// 1. Generate resource links
		const resourceLinks = generateHypermediaLinks(data, req.url);

		// 2. Generate pagination links if array
		let paginationLinks = [];
		if (Array.isArray(data)) {
			const page = parseInt(req.parsed.searchParams.get("page") || "1");
			const pageSize = parseInt(req.parsed.searchParams.get("page_size") || "10");
			paginationLinks = generatePaginationLinks(data.length * 10, page, pageSize, req.url);
		}

		// 3. Combine and deduplicate links
		const allLinks = [...resourceLinks, ...paginationLinks];
		const seen = new Set();
		const uniqueLinks = allLinks.filter(link => {
			if (seen.has(link.uri)) return false;
			seen.add(link.uri);

			return true;
		});

		// 4. Generate link header
		const linkHeader = uniqueLinks.map(link => `<${link.uri}>; rel="${link.rel}"`).join(", ");

		// 5. Set response header
		if (linkHeader) {
			res.header("Link", linkHeader);
		}

		return {
			data: data,
			links: uniqueLinks
		};
	};

	const req = createMockRequest({ url: "/api/users?page=2&page_size=10" });
	const res = createMockResponse();

	suite
		.add("Hypermedia Pipeline - Simple object", () => {
			processHypermedia(testData.simple, req, res);
		})
		.add("Hypermedia Pipeline - Small collection", () => {
			processHypermedia(testData.collection, req, res);
		})
		.add("Hypermedia Pipeline - Nested object", () => {
			processHypermedia(testData.nested, req, res);
		})
		.add("Hypermedia Pipeline - Large collection", () => {
			processHypermedia(testData.largeCollection, req, res);
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
 * Memory usage test for hypermedia processing
 */
function testHypermediaMemoryUsage () {
	console.log("\n📊 Hypermedia Memory Usage");
	console.log("-".repeat(40));

	const testData = createTestData();
	const iterations = 1000;

	// Test memory usage for different data sizes
	const tests = [
		{ name: "Simple object", data: testData.simple },
		{ name: "Small collection", data: testData.collection },
		{ name: "Large collection", data: testData.largeCollection }
	];

	for (const test of tests) {
		const startMem = process.memoryUsage();

		for (let i = 0; i < iterations; i++) {
			const links = generateHypermediaLinks(test.data, "/api");
			const seen = new Set();
			links.filter(link => {
				if (seen.has(link.uri)) return false;
				seen.add(link.uri);

				return true;
			});
		}

		const endMem = process.memoryUsage();

		console.log(`${test.name} (${iterations} iterations):`);
		const heapDiff = endMem.heapUsed - startMem.heapUsed;
		console.log(`  Heap Used: ${heapDiff >= 0 ? "+" : ""}${formatFilesize(heapDiff)}`);
	}
	console.log("  Note: Negative values indicate garbage collection occurred during test");
}

/**
 * Tests hypermedia link accuracy
 */
function testHypermediaAccuracy () {
	console.log("\n📊 Hypermedia Link Accuracy Test");
	console.log("-".repeat(40));

	const testObject = {
		id: 1,
		user_id: 123,
		category_id: 456,
		author_url: "/authors/789",
		related_ids: [100, 200, 300],
		tag_urls: ["/tags/tech", "/tags/javascript"],
		name: "Test Item",
		description: "Should not generate links"
	};

	const links = generateHypermediaLinks(testObject, "/api");

	console.log("Expected links from test object:");
	console.log("- /users/123 (from user_id)");
	console.log("- /categories/456 (from category_id)");
	console.log("- /authors/789 (from author_url)");
	console.log("- /related/100, /related/200, /related/300 (from related_ids)");
	console.log("- /tags/tech, /tags/javascript (from tag_urls)");

	console.log("\nActual generated links:");
	links.forEach(link => console.log(`- ${link.uri} (rel: ${link.rel})`));

	console.log(`\nTotal links generated: ${links.length}`);
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Hypermedia Performance Benchmarks");

	try {
		benchmarkBasicLinkGeneration();
		benchmarkPaginationLinks();
		benchmarkIdPatternMatching();
		benchmarkLinkDeduplication();
		benchmarkLinkHeaderGeneration();
		benchmarkHypermediaPipeline();
		testHypermediaMemoryUsage();
		testHypermediaAccuracy();

		console.log("\n✅ Hypermedia benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
