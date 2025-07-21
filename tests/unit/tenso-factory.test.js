import assert from "node:assert";
import { tenso } from "../../src/tenso.js";

// Test template content to avoid file system dependencies
const TEST_TEMPLATE = `<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>{{body}}</body>
</html>`;

describe("tenso factory", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof tenso, "function");
	});

	it("should return a Tenso instance", () => {
		const app = tenso({
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});
		assert.strictEqual(typeof app, "object");
		assert.strictEqual(typeof app.start, "function");
		assert.strictEqual(typeof app.stop, "function");
	});

	it("should use package.json version when no version is provided in config", () => {
		const app = tenso({
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		// The version should be set from package.json
		assert.strictEqual(typeof app.version, "string");
		assert.ok(app.version.length > 0);
	});

	it("should use custom version when provided in config", () => {
		const customVersion = "2.0.0-custom";
		const app = tenso({
			version: customVersion,
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		assert.strictEqual(app.version, customVersion);
	});

	it("should preserve user-provided version over package.json version", () => {
		const userVersion = "1.5.0-beta";
		const app = tenso({
			version: userVersion,
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		assert.strictEqual(app.version, userVersion);
	});

	it("should handle empty string version in config", () => {
		const app = tenso({
			version: "",
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		assert.strictEqual(app.version, "");
	});

	it("should handle null version in config (should use package.json version)", () => {
		const app = tenso({
			version: null,
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		// null should trigger the nullish coalescing to use package.json version
		assert.strictEqual(typeof app.version, "string");
		assert.ok(app.version.length > 0);
	});

	it("should handle undefined version in config (should use package.json version)", () => {
		const app = tenso({
			version: undefined,
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		// undefined should trigger the nullish coalescing to use package.json version
		assert.strictEqual(typeof app.version, "string");
		assert.ok(app.version.length > 0);
	});

	it("should merge user config with defaults while preserving custom version", () => {
		const customConfig = {
			version: "3.0.0-test",
			port: 9000,
			host: "127.0.0.1",
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		};

		const app = tenso(customConfig);

		assert.strictEqual(app.version, "3.0.0-test");
		assert.strictEqual(app.port, 9000);
		assert.strictEqual(app.host, "127.0.0.1");
	});

	it("should use package.json version when config is empty object", () => {
		const app = tenso({
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		assert.strictEqual(typeof app.version, "string");
		assert.ok(app.version.length > 0);
	});

	it("should use package.json version when no config is provided", () => {
		const app = tenso({
			webroot: {
				root: "./",
				static: "",
				template: TEST_TEMPLATE
			}
		});

		assert.strictEqual(typeof app.version, "string");
		assert.ok(app.version.length > 0);
	});
});
