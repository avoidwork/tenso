import {strict as assert} from "node:assert";
import {writeFileSync, unlinkSync, existsSync} from "node:fs";
import {resolve} from "node:path";
import {tenso} from "../../src/tenso.js";

describe("Tenso factory function extended", () => {
	let testFiles = [];
	let originalProcessExit;
	let processExitCalled;
	let exitCode;

	beforeEach(() => {
		// Mock process.exit
		originalProcessExit = process.exit;
		processExitCalled = false;
		exitCode = null;
		process.exit = code => {
			processExitCalled = true;
			exitCode = code;
			// Don't actually exit in tests
		};
	});

	afterEach(() => {
		// Clean up test files
		testFiles.forEach(file => {
			if (existsSync(file)) {
				unlinkSync(file);
			}
		});
		testFiles = [];
		// Restore original process.exit
		process.exit = originalProcessExit;
	});

	describe("Configuration validation", () => {
		it("should validate port configuration", () => {
			const server = tenso({
				port: 3000,
				webroot: {
					template: "www/template.html"
				}
			});
			assert.ok(server.port === 3000);
		});

		it("should exit with error for invalid port (non-digit string)", () => {
			tenso({
				port: "invalid",
				webroot: {
					template: "www/template.html"
				}
			});
			assert.strictEqual(processExitCalled, true);
			assert.strictEqual(exitCode, 1);
		});

		it("should exit with error for port less than 1", () => {
			tenso({
				port: 0,
				webroot: {
					template: "www/template.html"
				}
			});
			assert.strictEqual(processExitCalled, true);
			assert.strictEqual(exitCode, 1);
		});

		it("should handle valid numeric port", () => {
			const server = tenso({
				port: 8080,
				webroot: {
					template: "www/template.html"
				}
			});
			assert.strictEqual(processExitCalled, false);
			assert.ok(server.port === 8080);
		});
	});

	describe("Webroot template handling", () => {
		it("should read template from file when path provided", () => {
			const templateFile = resolve("./test-template.html");
			testFiles.push(templateFile);

			const templateContent = "<html><head><title>{{title}}</title></head><body>{{body}}</body></html>";
			writeFileSync(templateFile, templateContent);

			const server = tenso({
				webroot: {
					template: templateFile
				}
			});

			assert.strictEqual(server.webroot.template, templateContent);
			server.stop();
		});

		it("should keep template as string when HTML content provided", () => {
			const templateString = "<html><body>{{body}}</body></html>";

			const server = tenso({
				webroot: {
					template: templateString
				}
			});

			assert.strictEqual(server.webroot.template, templateString);
			server.stop();
		});

		it("should handle template string containing < character", () => {
			const templateString = "<div>Test content with < symbol</div>";

			const server = tenso({
				webroot: {
					template: templateString
				}
			});

			assert.strictEqual(server.webroot.template, templateString);
			server.stop();
		});
	});

	describe("Silent mode handling", () => {
		it("should set server headers when not silent", () => {
			const server = tenso({
				silent: false,
				title: "Test Server",
				version: "1.0.0",
				webroot: {
					template: "www/template.html"
				}
			});

			assert.ok(server.defaultHeaders.server);
			assert.ok(server.defaultHeaders["x-powered-by"]);
			assert.ok(server.defaultHeaders.server.includes("test server"));
			assert.ok(server.defaultHeaders.server.includes("1.0.0"));
			server.stop();
		});

		it("should not set server headers when silent", () => {
			const server = tenso({
				silent: true,
				title: "Test Server",
				version: "1.0.0",
				webroot: {
					template: "www/template.html"
				}
			});

			// Should not override existing headers when silent
			assert.ok(!server.defaultHeaders.server?.includes("test server"));
			server.stop();
		});

		it("should include platform and arch in x-powered-by header", () => {
			const server = tenso({
				silent: false,
				webroot: {
					template: "www/template.html"
				}
			});

			const poweredBy = server.defaultHeaders["x-powered-by"];
			assert.ok(poweredBy.includes(process.version));
			assert.ok(poweredBy.includes(process.platform));
			assert.ok(poweredBy.includes(process.arch));
			server.stop();
		});
	});

	describe("Version handling", () => {
		it("should use package.json version when config version is null", () => {
			const server = tenso({
				version: null,
				webroot: {
					template: "www/template.html"
				}
			});

			assert.ok(server.version);
			assert.notStrictEqual(server.version, null);
			server.stop();
		});

		it("should use package.json version when config version is undefined", () => {
			const server = tenso({
				version: undefined,
				webroot: {
					template: "www/template.html"
				}
			});

			assert.ok(server.version);
			assert.notStrictEqual(server.version, undefined);
			server.stop();
		});

		it("should preserve custom version when provided", () => {
			const customVersion = "2.5.1";
			const server = tenso({
				version: customVersion,
				webroot: {
					template: "www/template.html"
				}
			});

			assert.strictEqual(server.version, customVersion);
			server.stop();
		});
	});

	describe("Webroot path resolution", () => {
		it("should resolve webroot.root path", () => {
			const server = tenso({
				webroot: {
					root: "./test-dir",
					template: "www/template.html"
				}
			});

			assert.ok(server.webroot.root.includes("test-dir"));
			assert.ok(server.webroot.root.startsWith("/") || server.webroot.root.match(/^[A-Z]:/));
			server.stop();
		});

		it("should handle absolute paths for webroot.root", () => {
			const absolutePath = resolve("./test-absolute");
			const server = tenso({
				webroot: {
					root: absolutePath,
					template: "www/template.html"
				}
			});

			assert.strictEqual(server.webroot.root, absolutePath);
			server.stop();
		});
	});

	describe("Complex configurations", () => {
		it("should handle complex configuration merging", () => {
			const server = tenso({
				port: 9000,
				title: "Complex Test",
				auth: {
					bearer: {enabled: true}
				},
				security: {
					csrf: true
				},
				cors: {
					enabled: true,
					origin: "http://example.com"
				},
				rate: {
					enabled: true,
					limit: 100
				},
				webroot: {
					template: "www/template.html"
				}
			});

			assert.strictEqual(server.port, 9000);
			assert.strictEqual(server.title, "Complex Test");
			assert.strictEqual(server.auth.bearer.enabled, true);
			assert.strictEqual(server.security.csrf, true);
			assert.strictEqual(server.cors.enabled, true);
			assert.strictEqual(server.rate.enabled, true);
			server.stop();
		});

		it("should initialize and be ready to start", () => {
			const server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			// Should be initialized and ready
			assert.ok(typeof server.start === "function");
			assert.ok(typeof server.stop === "function");
			assert.ok(typeof server.get === "function");
			assert.ok(typeof server.post === "function");
			assert.strictEqual(server.server, null); // Not started yet

			server.stop();
		});
	});

	describe("Error handling", () => {
		it("should handle invalid template file path gracefully", () => {
			const invalidPath = "./non-existent-template.html";

			assert.throws(() => {
				tenso({
					webroot: {
						template: invalidPath
					}
				});
			}, /ENOENT/);
		});

		it("should handle empty configuration object", () => {
			const server = tenso({
				webroot: {
					template: "www/template.html"
				}
			});

			assert.ok(server instanceof Object);
			assert.ok(server.version);
			assert.ok(server.port);
			server.stop();
		});

		it("should handle null configuration", () => {
			// Null configuration should cause process.exit to be called
			tenso(null);
			assert.strictEqual(processExitCalled, true);
		});

		it("should handle undefined configuration", () => {
			const server = tenso(undefined);

			assert.ok(server instanceof Object);
			assert.ok(server.version);
			server.stop();
		});
	});
});
