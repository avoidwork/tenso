import {strict as assert} from "node:assert";
import {writeFileSync, unlinkSync, existsSync} from "node:fs";
import {resolve} from "node:path";
import {Tenso} from "../../src/tenso.js";
import promClient from "prom-client";

describe("Tenso server lifecycle", () => {
	let server;
	let testFiles = [];

	afterEach(() => {
		if (server?.server) {
			server.stop();
		}
		// Clean up test files
		testFiles.forEach(file => {
			if (existsSync(file)) {
				unlinkSync(file);
			}
		});
		testFiles = [];
	});

	describe("init method", () => {
		it("should initialize server with default configuration", () => {
			server = new Tenso();
			const result = server.init();

			assert.strictEqual(result, server);
			assert.ok(typeof server.onSend === "function");
		});

		it("should initialize with authorization enabled", () => {
			server = new Tenso({
				auth: {basic: {enabled: true}},
				rate: {enabled: true}
			});
			const result = server.init();

			assert.strictEqual(result, server);
		});

		it("should initialize with prometheus enabled", () => {
			// Clear the default registry to prevent metric registration conflicts
			promClient.register.clear();

			server = new Tenso({
				prometheus: {enabled: true}
			});
			const result = server.init();

			assert.strictEqual(result, server);
		});

		it("should handle static file serving", () => {
			server = new Tenso({
				webroot: {
					static: "./www/assets",
					root: "./www"
				}
			});
			const result = server.init();

			assert.strictEqual(result, server);
		});

		it("should set up always routes", () => {
			const mockMiddleware = (req, res, next) => next();
			server = new Tenso({
				initRoutes: {
					always: {
						"/middleware": mockMiddleware
					},
					get: {
						"/test": () => "test"
					}
				}
			});
			const result = server.init();

			assert.strictEqual(result, server);
		});

		it("should handle maxListeners configuration", () => {
			const originalMax = process.getMaxListeners();
			server = new Tenso({maxListeners: originalMax + 5});
			server.init();

			assert.ok(process.getMaxListeners() >= originalMax);
		});
	});

	describe("rateLimit method", () => {
		beforeEach(() => {
			server = new Tenso({
				rate: {
					limit: 10,
					reset: 60
				}
			});
		});

		it("should create new rate limit state for new request", () => {
			const req = {ip: "127.0.0.1"};
			const [valid, , remaining, reset] = server.rateLimit(req);

			assert.strictEqual(valid, true);
			assert.strictEqual(remaining, 9);
			assert.ok(reset > 0);
		});

		it("should use sessionID if available", () => {
			const req = {sessionID: "test-session", ip: "127.0.0.1"};
			const [valid] = server.rateLimit(req);

			assert.strictEqual(valid, true);
		});

		it("should decrement remaining count on subsequent requests", () => {
			const req = {ip: "127.0.0.1"};
			server.rateLimit(req);
			const [valid, , remaining] = server.rateLimit(req);

			assert.strictEqual(valid, true);
			assert.strictEqual(remaining, 8);
		});

		it("should return invalid when limit exceeded", () => {
			const req = {ip: "127.0.0.1"};

			// Exhaust the limit
			for (let i = 0; i < 11; i++) {
				server.rateLimit(req);
			}

			const [valid, , remaining] = server.rateLimit(req);
			assert.strictEqual(valid, false);
			assert.strictEqual(remaining, 0);
		});

		it("should handle custom rate limit function", () => {
			const req = {ip: "127.0.0.1"};
			const customFn = (reqParam, state) => ({...state, limit: 5});

			const [valid] = server.rateLimit(req, customFn);
			assert.strictEqual(valid, true);
		});

		it("should reset rate limit after time window", () => {
			const req = {ip: "127.0.0.1"};
			server.rateLimit(req);

			// Manually adjust the rate state to simulate time passage
			const state = server.rates.get("127.0.0.1");
			state.reset = Math.floor(Date.now() / 1000) - 1;

			const [valid, , remaining] = server.rateLimit(req);
			assert.strictEqual(valid, true);
			assert.strictEqual(remaining, 9); // Reset and decremented
		});
	});

	describe("render method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should render with default mimeType", () => {
			const req = {
				parsed: {searchParams: new URLSearchParams()},
				headers: {accept: "application/json"}
			};
			const res = {
				getHeader: () => "application/json",
				getHeaders: () => ({}),
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.render(req, res, data);
			assert.ok(result !== null);
		});

		it("should use accept header for format selection", () => {
			const req = {
				parsed: {searchParams: new URLSearchParams()},
				headers: {accept: "application/json"}
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.render(req, res, data);
			assert.ok(result !== null);
		});

		it("should use format query parameter", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("format", "application/xml");
			const req = {
				parsed: {searchParams},
				headers: {}
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.render(req, res, data);
			assert.ok(result !== null);
		});

		it("should handle null data by converting to 'null'", () => {
			const req = {
				parsed: {searchParams: new URLSearchParams()},
				headers: {accept: "text/plain"}
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};

			const result = server.render(req, res, null);
			assert.strictEqual(result, "null");
		});

		it("should handle multiple accept types", () => {
			const req = {
				parsed: {searchParams: new URLSearchParams()},
				headers: {accept: "text/html,application/json;q=0.9"}
			};
			const res = {
				getHeader: () => "text/html",
				getHeaders: () => ({}),
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.render(req, res, data);
			assert.ok(result !== null);
		});

		it("should fallback to default mimeType for unsupported format", () => {
			const req = {
				parsed: {searchParams: new URLSearchParams()},
				headers: {accept: "application/unsupported"}
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.render(req, res, data);
			assert.ok(result !== null);
		});
	});

	describe("start method", () => {
		it("should start HTTP server", () => {
			server = new Tenso({port: 0, host: "127.0.0.1"});
			server.init();
			const result = server.start();

			assert.strictEqual(result, server);
			assert.ok(server.server !== null);
		});

		it("should not start server if already running", () => {
			server = new Tenso({port: 0, host: "127.0.0.1"});
			server.init();
			server.start();
			const originalServer = server.server;

			const result = server.start();
			assert.strictEqual(result, server);
			assert.strictEqual(server.server, originalServer);
		});

		it("should start HTTPS server with SSL config", () => {
			// Create test certificate files
			const certFile = resolve("./test-cert.pem");
			const keyFile = resolve("./test-key.pem");
			testFiles.push(certFile, keyFile);

			writeFileSync(certFile, "-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJATest\n-----END CERTIFICATE-----");
			writeFileSync(keyFile, "-----BEGIN PRIVATE KEY-----\nMIIEvQTest\n-----END PRIVATE KEY-----");

			server = new Tenso({
				port: 0,
				host: "127.0.0.1",
				ssl: {
					cert: certFile,
					key: keyFile
				}
			});
			server.init();

			// This will fail with invalid cert, but we're testing the code path
			let startFailed = false;
			try {
				server.start();
			} catch {
				// Expected to fail with test certificates
				startFailed = true;
			}

			// Server creation should fail with invalid certificates
			assert.ok(startFailed || server.server === null);
		});

		it("should handle pfx SSL configuration", () => {
			const pfxFile = resolve("./test.pfx");
			testFiles.push(pfxFile);

			writeFileSync(pfxFile, Buffer.from("test pfx data"));

			server = new Tenso({
				port: 0,
				host: "127.0.0.1",
				ssl: {
					pfx: pfxFile
				}
			});
			server.init();

			let startFailed = false;
			try {
				server.start();
			} catch {
				// Expected to fail with test pfx
				startFailed = true;
			}

			// Server creation should fail with invalid PFX data
			assert.ok(startFailed || server.server === null);
		});
	});

	describe("stop method", () => {
		it("should stop running server", () => {
			server = new Tenso({port: 0, host: "127.0.0.1"});
			server.init();
			server.start();

			const result = server.stop();
			assert.strictEqual(result, server);
			assert.strictEqual(server.server, null);
		});

		it("should handle stopping when server is not running", () => {
			server = new Tenso();
			const result = server.stop();

			assert.strictEqual(result, server);
			assert.strictEqual(server.server, null);
		});
	});
});
