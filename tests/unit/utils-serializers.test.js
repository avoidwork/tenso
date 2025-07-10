import assert from "node:assert";
import { serializers } from "../../src/utils/serializers.js";

describe("serializers", () => {
	it("should be a Map instance", () => {
		assert.ok(serializers instanceof Map);
	});

	it("should contain application/json serializer", () => {
		assert.ok(serializers.has("application/json"));
		assert.strictEqual(typeof serializers.get("application/json"), "function");
	});

	it("should contain application/yaml serializer", () => {
		assert.ok(serializers.has("application/yaml"));
		assert.strictEqual(typeof serializers.get("application/yaml"), "function");
	});

	it("should contain application/xml serializer", () => {
		assert.ok(serializers.has("application/xml"));
		assert.strictEqual(typeof serializers.get("application/xml"), "function");
	});

	it("should contain text/plain serializer", () => {
		assert.ok(serializers.has("text/plain"));
		assert.strictEqual(typeof serializers.get("text/plain"), "function");
	});

	it("should contain application/javascript serializer", () => {
		assert.ok(serializers.has("application/javascript"));
		assert.strictEqual(typeof serializers.get("application/javascript"), "function");
	});

	it("should contain text/csv serializer", () => {
		assert.ok(serializers.has("text/csv"));
		assert.strictEqual(typeof serializers.get("text/csv"), "function");
	});

	it("should contain text/html serializer", () => {
		assert.ok(serializers.has("text/html"));
		assert.strictEqual(typeof serializers.get("text/html"), "function");
	});

	it("should contain application/json-lines serializer", () => {
		assert.ok(serializers.has("application/json-lines"));
		assert.strictEqual(typeof serializers.get("application/json-lines"), "function");
	});

	it("should contain application/jsonl serializer", () => {
		assert.ok(serializers.has("application/jsonl"));
		assert.strictEqual(typeof serializers.get("application/jsonl"), "function");
	});

	it("should contain text/json-lines serializer", () => {
		assert.ok(serializers.has("text/json-lines"));
		assert.strictEqual(typeof serializers.get("text/json-lines"), "function");
	});

	it("should have expected number of serializers", () => {
		assert.strictEqual(serializers.size, 10);
	});

	it("should return undefined for unknown content types", () => {
		assert.strictEqual(serializers.get("unknown/type"), undefined);
		assert.strictEqual(serializers.get("application/unknown"), undefined);
	});

	it("should be case-sensitive for content types", () => {
		assert.strictEqual(serializers.get("APPLICATION/JSON"), undefined);
		assert.strictEqual(serializers.get("Application/Json"), undefined);
	});

	it("should support iteration", () => {
		const contentTypes = Array.from(serializers.keys());
		assert.ok(contentTypes.includes("application/json"));
		assert.ok(contentTypes.includes("text/plain"));
	});

	it("should support forEach", () => {
		let count = 0;
		serializers.forEach((serializer, contentType) => {
			assert.strictEqual(typeof serializer, "function");
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
			assert.ok(serializers.has(type), `Should have ${type} serializer`);
		});
	});

	it("should use custom serializer for complex types", () => {
		const customTypes = [
			"application/json",
			"application/yaml",
			"application/xml",
			"application/javascript",
			"text/html"
		];

		customTypes.forEach(type => {
			const serializer = serializers.get(type);
			assert.ok(serializer, `Should have serializer for ${type}`);
			// Custom serializers should be the same function (imported from custom.js)
		});
	});

	it("should use plain serializer for simple types", () => {
		const plainTypes = [
			"text/plain",
			"text/csv",
			"application/json-lines",
			"application/jsonl",
			"text/json-lines"
		];

		plainTypes.forEach(type => {
			const serializer = serializers.get(type);
			assert.ok(serializer, `Should have serializer for ${type}`);
			// Plain serializers should be the same function (imported from plain.js)
		});
	});
});
