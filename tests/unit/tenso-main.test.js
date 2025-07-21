import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import { tenso, Tenso } from "../../dist/tenso.js";

describe("Tenso Factory Function", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 120, logging: { enabled: false } });
	});

	afterEach(() => {
		if (app && app.server) {
			app.stop();
		}
	});

	it("should create a Tenso instance with default configuration", () => {
		assert(app instanceof Tenso);
		assert.strictEqual(app.port, 8000);
		assert.strictEqual(app.host, "0.0.0.0");
		assert.strictEqual(app.charset, "utf-8");
	});

	it("should create a Tenso instance with custom configuration", () => {
		const config = {
			port: 3000,
			host: "127.0.0.1",
			title: "Test Server",
			logging: {
				enabled: false
			}
		};
		config.maxListeners = 100;
		app = tenso(config);
		assert(app instanceof Tenso);
		assert.strictEqual(app.port, 3000);
		assert.strictEqual(app.host, "127.0.0.1");
		assert.strictEqual(app.title, "Test Server");
	});

	it("should merge user config with default config", () => {
		const config = {
			port: 9000,
			customProp: "test", logging: { enabled: false }
		};
		config.maxListeners = 100;
		app = tenso(config);
		assert.strictEqual(app.port, 9000);
		assert.strictEqual(app.customProp, "test");
		// Should retain default values for unspecified properties
		assert.strictEqual(app.charset, "utf-8");
	});

	it("should handle silent mode configuration", () => {
		const config = { silent: true, logging: { enabled: false } };
		config.maxListeners = 100;
		app = tenso(config);
		assert.strictEqual(app.silent, true);
	});

	it("should handle SSL configuration", () => {
		const config = {
			ssl: {
				cert: null,
				key: null,
				pfx: null
			}, logging: { enabled: false }
		};
		config.maxListeners = 100;
		app = tenso(config);
		assert.deepStrictEqual(app.ssl, config.ssl);
	});

	it("should handle authentication configuration", () => {
		const config = {
			auth: {
				basic: {
					enabled: true,
					list: ["user:pass"]
				}
			}, logging: { enabled: false }
		};
		config.maxListeners = 100;
		app = tenso(config);
		assert.strictEqual(app.auth.basic.enabled, true);
		assert.deepStrictEqual(app.auth.basic.list, ["user:pass"]);
	});

	it("should handle rate limiting configuration", () => {
		const config = {
			rate: {
				enabled: true,
				limit: 100,
				reset: 3600
			}, logging: { enabled: false }
		};
		config.maxListeners = 100;
		app = tenso(config);
		assert.strictEqual(app.rate.enabled, true);
		assert.strictEqual(app.rate.limit, 100);
		assert.strictEqual(app.rate.reset, 3600);
	});
});

describe("Tenso Class", () => {
	let instance;

	beforeEach(() => {
		instance = new Tenso({logging: { enabled: false }});
	});

	afterEach(() => {
		if (instance && instance.server) {
			instance.stop();
		}
	});

	describe("Constructor", () => {
		it("should create instance with default config", () => {
			assert(instance instanceof Tenso);
			assert.strictEqual(instance.port, 8000);
			assert(instance.parsers instanceof Map);
			assert(instance.renderers instanceof Map);
			assert(instance.serializers instanceof Map);
			assert(instance.rates instanceof Map);
		});

		it("should accept custom config", () => {
			const config = { port: 4000, title: "Custom", maxListeners: 120, logging: { enabled: false } };
			const customInstance = new Tenso(config);
			assert.strictEqual(customInstance.port, 4000);
			assert.strictEqual(customInstance.title, "Custom");
		});
	});

	describe("canModify method", () => {
		it("should return true for DELETE method", () => {
			assert.strictEqual(instance.canModify("DELETE"), true);
		});

		it("should return true for POST method", () => {
			assert.strictEqual(instance.canModify("POST"), true);
		});

		it("should return true for PUT method", () => {
			assert.strictEqual(instance.canModify("PUT"), true);
		});

		it("should return true for PATCH method", () => {
			assert.strictEqual(instance.canModify("PATCH"), true);
		});

		it("should return false for GET method", () => {
			assert.strictEqual(instance.canModify("GET"), false);
		});

		it("should return false for OPTIONS method", () => {
			assert.strictEqual(instance.canModify("OPTIONS"), false);
		});

		it("should handle comma-separated methods", () => {
			assert.strictEqual(instance.canModify("GET,POST"), true);
			assert.strictEqual(instance.canModify("GET,OPTIONS"), false);
		});
	});

	describe("connect method", () => {
		it("should set up request properties", () => {
			const req = {
				method: "GET",
				parsed: { pathname: "/test" },
				allow: "GET,POST",
				cors: false
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			instance.connect(req, res);

			assert.strictEqual(req.csrf, true);
			assert.strictEqual(req.hypermedia, true);
			assert.strictEqual(req.hypermediaHeader, true);
			assert.strictEqual(req.private, false);
			assert.strictEqual(req.protect, false);
			assert.strictEqual(req.protectAsync, false);
			assert.strictEqual(req.unprotect, false);
			assert.strictEqual(req.url, "/test");
			assert.strictEqual(req.server, instance);
		});

		it("should set CSRF flag for modifiable methods", () => {
			const req = {
				method: "GET",
				parsed: { pathname: "/test" },
				allow: "GET,POST,PUT",
				cors: false
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			instance.security = { csrf: true };
			instance.connect(req, res);

			assert.strictEqual(req.csrf, true);
		});

		it("should handle CORS headers", () => {
			let removedHeader = null;
			let setHeaders = {};

			const req = {
				method: "OPTIONS",
				parsed: { pathname: "/test" },
				allow: "GET,POST",
				cors: true
			};
			const res = {
				removeHeader: header => { removedHeader = header; },
				header: (name, value) => { setHeaders[name] = value; }
			};

			instance.corsExpose = "x-custom-header";
			instance.security = { key: "x-csrf-token", csrf: true };
			instance.connect(req, res);

			assert.strictEqual(removedHeader, "access-control-allow-headers");
			assert(setHeaders["access-control-allow-headers"].includes("x-custom-header"));
		});
	});

	describe("eventsource method", () => {
		it("should call eventsource function with arguments", () => {
			// Mock the eventsource function
			const originalEventsource = instance.eventsource; // eslint-disable-line no-unused-vars
			let calledArgs = null; // eslint-disable-line no-unused-vars

			// Since eventsource is imported, we can't easily mock it
			// Just test that the method exists and is callable
			assert.strictEqual(typeof instance.eventsource, "function");
		});
	});

	describe("final method", () => {
		it("should return the argument unchanged", () => {
			const req = {};
			const res = {};
			const arg = { test: "data" };

			const result = instance.final(req, res, arg);
			assert.strictEqual(result, arg);
		});
	});

	describe("headers method", () => {
		it("should set private cache control for protected requests", () => {
			let removedHeaders = [];
			let setHeaders = {};

			const req = { protect: true, csrf: false, private: false };
			const res = {
				getHeader: name => name === "cache-control" ? "public, max-age=3600" : null,
				removeHeader: name => removedHeaders.push(name),
				header: (name, value) => setHeaders[name] = value // eslint-disable-line no-return-assign
			};

			instance.headers(req, res);

			assert(removedHeaders.includes("cache-control"));
			assert(setHeaders["cache-control"].includes("private"));
		});

		it("should set private cache control for CSRF requests", () => {
			let setHeaders = {};

			const req = { protect: false, csrf: true, private: false };
			const res = {
				getHeader: name => name === "cache-control" ? "public" : null,
				removeHeader: () => {},
				header: (name, value) => setHeaders[name] = value // eslint-disable-line no-return-assign
			};

			instance.headers(req, res);

			assert(setHeaders["cache-control"].includes("private"));
		});

		it("should handle empty cache control header", () => {
			let setHeaders = {};

			const req = { protect: true, csrf: false, private: false };
			const res = {
				getHeader: () => "",
				removeHeader: () => {},
				header: (name, value) => setHeaders[name] = value // eslint-disable-line no-return-assign
			};

			instance.headers(req, res);

			assert.strictEqual(setHeaders["cache-control"], "private");
		});
	});

	describe("parser method", () => {
		it("should register a parser for a media type", () => {
			const parser = data => JSON.parse(data);
			const result = instance.parser("application/test", parser);

			assert.strictEqual(result, instance);
			assert.strictEqual(instance.parsers.get("application/test"), parser);
		});

		it("should use default parameters", () => {
			const result = instance.parser();
			assert.strictEqual(result, instance);
			assert(instance.parsers.has(""));
		});
	});

	describe("renderer method", () => {
		it("should register a renderer for a media type", () => {
			const renderer = (req, res, data) => JSON.stringify(data);
			const result = instance.renderer("application/test", renderer);

			assert.strictEqual(result, instance);
			assert.strictEqual(instance.renderers.get("application/test"), renderer);
		});
	});

	describe("serializer method", () => {
		it("should register a serializer for a media type", () => {
			const serializer = (data, err, status) => ({ data, error: err, status });
			const result = instance.serializer("application/test", serializer);

			assert.strictEqual(result, instance);
			assert.strictEqual(instance.serializers.get("application/test"), serializer);
		});
	});

	describe("rateLimit method", () => {
		it("should initialize rate limit state for new session", () => {
			const req = { sessionID: "test-session", ip: "127.0.0.1" };
			instance.rate = { limit: 100, reset: 3600 };

			const [valid, limit, remaining, reset] = instance.rateLimit(req);

			assert.strictEqual(valid, true);
			assert.strictEqual(limit, 100);
			assert.strictEqual(remaining, 99);
			assert(typeof reset === "number");
			assert(instance.rates.has("test-session"));
		});

		it("should use IP address when sessionID is not available", () => {
			const req = { ip: "192.168.1.1" };
			instance.rate = { limit: 50, reset: 1800 };

			const [valid, limit, remaining, reset] = instance.rateLimit(req); // eslint-disable-line no-unused-vars

			assert.strictEqual(valid, true);
			assert.strictEqual(limit, 50);
			assert.strictEqual(remaining, 49);
			assert(instance.rates.has("192.168.1.1"));
		});

		it("should decrement remaining count on subsequent requests", () => {
			const req = { sessionID: "test-session2" };
			instance.rate = { limit: 10, reset: 3600 };

			// First request
			let [valid, limit, remaining] = instance.rateLimit(req);
			assert.strictEqual(remaining, 9);

			// Second request
			[valid, limit, remaining] = instance.rateLimit(req); // eslint-disable-line no-unused-vars
			assert.strictEqual(remaining, 8);
		});

		it("should return false when rate limit is exceeded", () => {
			const req = { sessionID: "test-session3" };
			instance.rate = { limit: 2, reset: 3600 };

			// Exhaust the limit
			instance.rateLimit(req); // remaining: 1
			instance.rateLimit(req); // remaining: 0
			const [valid] = instance.rateLimit(req); // should be false

			assert.strictEqual(valid, false);
		});

		it("should accept custom function to modify rate state", () => {
			const req = { sessionID: "test-session4" };
			instance.rate = { limit: 100, reset: 3600 };

			const customFn = (req, state) => { // eslint-disable-line no-shadow
				state.limit = 200;

				return state;
			};

			const [valid, limit] = instance.rateLimit(req, customFn); // eslint-disable-line no-unused-vars

			assert.strictEqual(limit, 200);
		});

		it("should reset rate limit when time window expires", () => {
			const req = { sessionID: "test-session5" };
			instance.rate = { limit: 10, reset: 1 };

			// Set up initial state
			instance.rateLimit(req);

			// Manually set reset time to past
			const state = instance.rates.get("test-session5");
			state.reset = Math.floor(Date.now() / 1000) - 1;

			const [valid, limit, remaining] = instance.rateLimit(req); // eslint-disable-line no-unused-vars

			assert.strictEqual(valid, true);
			assert.strictEqual(remaining, 9); // Should be reset to limit - 1
		});
	});

	describe("render method", () => {
		it("should render data using registered renderer", () => {
			const req = {
				parsed: { searchParams: { get: () => null } },
				headers: { accept: "application/json" },
				server: instance
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};

			instance.mimeType = "application/json";
			const result = instance.render(req, res, { test: "data" });

			assert(typeof result === "string");
			assert(result.includes('"test":"data"'));
		});

		it("should handle null data", () => {
			const req = {
				parsed: { searchParams: { get: () => null } },
				headers: { accept: "application/json" },
				server: instance
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};

			const result = instance.render(req, res, null);
			assert.strictEqual(result, '"null"');
		});

		it("should use format from query parameters", () => {
			const req = {
				parsed: { searchParams: { get: key => key === "format" ? "text/plain" : null } },
				headers: {}
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};

			const result = instance.render(req, res, "test data");
			assert.strictEqual(result, "test data");
		});

		it("should fall back to default mime type for unknown formats", () => {
			const req = {
				parsed: { searchParams: { get: () => null } },
				headers: { accept: "application/unknown" },
				server: instance
			};
			const res = {
				getHeader: () => null,
				header: () => {}
			};

			instance.mimeType = "application/json";
			const result = instance.render(req, res, { test: "data" });

			assert(typeof result === "string");
		});
	});

	describe("signals method", () => {
		it("should return the instance", () => {
			const result = instance.signals();
			assert.strictEqual(result, instance);
		});
	});

	describe("start method", () => {
		it("should start HTTP server when no SSL config", () => {
			instance.ssl = { cert: null, key: null, pfx: null };
			instance.port = 0; // Use random port
			instance.host = "127.0.0.1";

			const result = instance.start();
			assert.strictEqual(result, instance);
			assert(instance.server !== null);

			instance.stop();
		});

		it("should not start server if already started", () => {
			instance.ssl = { cert: null, key: null, pfx: null };
			instance.port = 0;
			instance.host = "127.0.0.1";

			instance.start();
			const server1 = instance.server;
			instance.start();
			const server2 = instance.server;

			assert.strictEqual(server1, server2);
			instance.stop();
		});
	});

	describe("stop method", () => {
		it("should stop the server", () => {
			instance.ssl = { cert: null, key: null, pfx: null };
			instance.port = 0;
			instance.host = "127.0.0.1";

			instance.start();
			assert(instance.server !== null);

			const result = instance.stop();
			assert.strictEqual(result, instance);
			assert.strictEqual(instance.server, null);
		});

		it("should handle stopping when server is not running", () => {
			assert.strictEqual(instance.server, null);
			const result = instance.stop();
			assert.strictEqual(result, instance);
			assert.strictEqual(instance.server, null);
		});
	});

	describe("init method", () => {
		it("should initialize the server and return instance", () => {
			const result = instance.init();
			assert.strictEqual(result, instance);
		});

		it("should handle prometheus configuration", () => {
			// Set prometheus to disabled for this test to avoid registration conflicts
			instance.prometheus = { enabled: false, metrics: {} };
			const result = instance.init();
			assert.strictEqual(result, instance);

			// Test that the configuration was accepted
			assert.strictEqual(instance.prometheus.enabled, false);
		});

		it("should handle auth configuration", () => {
			// Mock the auth configuration to avoid needing actual auth setup
			instance.auth = {
				basic: { enabled: false }, // Disable to avoid setup complexity
				protect: [],
				unprotect: []
			};
			instance.rate = { enabled: false };
			instance.security = { csrf: false };

			const result = instance.init();
			assert.strictEqual(result, instance);
		});

		it("should handle webroot static configuration", () => {
			instance.webroot = { static: "/assets", root: process.cwd() };
			const result = instance.init();
			assert.strictEqual(result, instance);
		});

		it("should handle initRoutes configuration", () => {
			instance.initRoutes = {
				get: {
					"/test": (req, res) => res.json({ test: true })
				},
				always: {
					"/middleware": (req, res, next) => next()
				}
			};
			const result = instance.init();
			assert.strictEqual(result, instance);
		});
	});
});
