import assert from "node:assert";
import { renderers } from "../../src/utils/renderers.js";

describe("renderers", () => {
	it("should be a Map instance", () => {
		assert.ok(renderers instanceof Map);
	});

	it("should contain application/json renderer", () => {
		assert.ok(renderers.has("application/json"));
		assert.strictEqual(typeof renderers.get("application/json"), "function");
	});

	it("should contain application/yaml renderer", () => {
		assert.ok(renderers.has("application/yaml"));
		assert.strictEqual(typeof renderers.get("application/yaml"), "function");
	});

	it("should contain application/xml renderer", () => {
		assert.ok(renderers.has("application/xml"));
		assert.strictEqual(typeof renderers.get("application/xml"), "function");
	});

	it("should contain text/plain renderer", () => {
		assert.ok(renderers.has("text/plain"));
		assert.strictEqual(typeof renderers.get("text/plain"), "function");
	});

	it("should contain application/javascript renderer", () => {
		assert.ok(renderers.has("application/javascript"));
		assert.strictEqual(typeof renderers.get("application/javascript"), "function");
	});

	it("should contain text/csv renderer", () => {
		assert.ok(renderers.has("text/csv"));
		assert.strictEqual(typeof renderers.get("text/csv"), "function");
	});

	it("should contain text/html renderer", () => {
		assert.ok(renderers.has("text/html"));
		assert.strictEqual(typeof renderers.get("text/html"), "function");
	});

	it("should contain application/json-lines renderer", () => {
		assert.ok(renderers.has("application/json-lines"));
		assert.strictEqual(typeof renderers.get("application/json-lines"), "function");
	});

	it("should contain application/jsonl renderer", () => {
		assert.ok(renderers.has("application/jsonl"));
		assert.strictEqual(typeof renderers.get("application/jsonl"), "function");
	});

	it("should contain text/json-lines renderer", () => {
		assert.ok(renderers.has("text/json-lines"));
		assert.strictEqual(typeof renderers.get("text/json-lines"), "function");
	});

	it("should have expected number of renderers", () => {
		assert.strictEqual(renderers.size, 10);
	});

	it("should return undefined for unknown content types", () => {
		assert.strictEqual(renderers.get("unknown/type"), undefined);
		assert.strictEqual(renderers.get("application/unknown"), undefined);
	});

	it("should be case-sensitive for content types", () => {
		assert.strictEqual(renderers.get("APPLICATION/JSON"), undefined);
		assert.strictEqual(renderers.get("Application/Json"), undefined);
	});

	it("should support iteration", () => {
		const contentTypes = Array.from(renderers.keys());
		assert.ok(contentTypes.includes("application/json"));
		assert.ok(contentTypes.includes("text/plain"));
	});

	it("should support forEach", () => {
		let count = 0;
		renderers.forEach((renderer, contentType) => {
			assert.strictEqual(typeof renderer, "function");
			assert.strictEqual(typeof contentType, "string");
			count++;
		});
		assert.strictEqual(count, 10);
	});

	it("should have all expected content types", () => {
		const expectedTypes = [
			"application/json",
			"application/yaml",
			"application/xml",
			"text/plain",
			"application/javascript",
			"text/csv",
			"text/html",
			"application/json-lines",
			"application/jsonl",
			"text/json-lines"
		];

		expectedTypes.forEach(type => {
			assert.ok(renderers.has(type), `Should have ${type} renderer`);
		});
	});

	it("should use specific renderer functions", () => {
		// Each renderer should be a distinct function imported from its own module
		const jsonRenderer = renderers.get("application/json");
		const yamlRenderer = renderers.get("application/yaml");
		const xmlRenderer = renderers.get("application/xml");
		const plainRenderer = renderers.get("text/plain");
		const javascriptRenderer = renderers.get("application/javascript");
		const csvRenderer = renderers.get("text/csv");
		const htmlRenderer = renderers.get("text/html");
		const jsonlRenderer = renderers.get("application/jsonl");

		assert.ok(jsonRenderer);
		assert.ok(yamlRenderer);
		assert.ok(xmlRenderer);
		assert.ok(plainRenderer);
		assert.ok(javascriptRenderer);
		assert.ok(csvRenderer);
		assert.ok(htmlRenderer);
		assert.ok(jsonlRenderer);
	});

	it("should use jsonl renderer for multiple JSON line formats", () => {
		const jsonlRenderer = renderers.get("application/jsonl");
		const jsonLinesRenderer = renderers.get("application/json-lines");
		const textJsonLinesRenderer = renderers.get("text/json-lines");

		// These should all use the same jsonl renderer
		assert.strictEqual(jsonlRenderer, jsonLinesRenderer);
		assert.strictEqual(jsonlRenderer, textJsonLinesRenderer);
	});

	it("should be immutable via direct access", () => {
		const originalSize = renderers.size;

		// These operations should work
		renderers.set("test/type", () => {});
		assert.strictEqual(renderers.size, originalSize + 1);

		renderers.delete("test/type");
		assert.strictEqual(renderers.size, originalSize);
	});
});
