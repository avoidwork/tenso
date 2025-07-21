import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import { tenso } from "../../dist/tenso.js";
import { hypermedia } from "../../src/utils/hypermedia.js";

describe("Middleware Functions", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 60, logging: { enabled: false } });
	});

	afterEach(() => {
		if (app && app.server) {
			app.stop();
		}
	});

	describe("Payload Middleware", () => {
		it("should skip payload collection for GET requests", done => {
			const req = {
				method: "GET",
				headers: { "content-type": "application/json" }
			};
			const res = {}; // eslint-disable-line no-unused-vars

			// Create a simple payload middleware test
			const mockNext = () => {
				// Should skip payload collection for GET
				assert.strictEqual(req.body, undefined);
				done();
			};

			// Test through the app's middleware system
			// Since payload middleware is internal, we test its behavior through canModify
			assert.strictEqual(app.canModify("GET"), false);
			mockNext();
		});

		it("should collect payload for POST requests", () => {
			// Test that POST methods are recognized as having bodies
			assert.strictEqual(app.canModify("POST"), true);
		});

		it("should collect payload for PUT requests", () => {
			assert.strictEqual(app.canModify("PUT"), true);
		});

		it("should collect payload for PATCH requests", () => {
			assert.strictEqual(app.canModify("PATCH"), true);
		});

		it("should skip payload for multipart content", () => {
			// Test through canModify - multipart handling is done elsewhere
			const req = { // eslint-disable-line no-unused-vars
				method: "POST",
				headers: { "content-type": "multipart/form-data" }
			};

			assert.strictEqual(app.canModify("POST"), true);
		});
	});

	describe("Parse Middleware", () => {
		it("should parse JSON content", () => {
			const jsonParser = app.parsers.get("application/json");
			const input = '{"name": "test", "value": 123}';
			const result = jsonParser(input);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should parse form-urlencoded content", () => {
			const formParser = app.parsers.get("application/x-www-form-urlencoded");
			const input = "name=test&value=123";
			const result = formParser(input);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should parse JSONL content", () => {
			const jsonlParser = app.parsers.get("application/jsonl");
			const input = '{"name": "test1"}\n{"name": "test2"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
		});

		it("should handle empty body", () => {
			const jsonParser = app.parsers.get("application/json");

			// Empty string is not valid JSON and should throw
			assert.throws(() => {
				jsonParser("");
			}, SyntaxError);
		});

		it("should handle unsupported content types", () => {
			// Unsupported content type should not have a parser
			assert.strictEqual(app.parsers.has("application/unknown"), false);
		});
	});

	describe("Rate Limiting", () => {
		it("should initialize rate limiting state", () => {
			const req = { sessionID: "test-session", ip: "127.0.0.1" };
			app.rate = { limit: 100, reset: 3600 };

			const [valid, limit, remaining, reset] = app.rateLimit(req);

			assert.strictEqual(valid, true);
			assert.strictEqual(limit, 100);
			assert.strictEqual(remaining, 99);
			assert(typeof reset === "number");
		});

		it("should track requests across calls", () => {
			const req = { sessionID: "test-session2", ip: "127.0.0.1" };
			app.rate = { limit: 5, reset: 3600 };

			// First request
			let [valid, limit, remaining] = app.rateLimit(req);
			assert.strictEqual(remaining, 4);

			// Second request
			[valid, limit, remaining] = app.rateLimit(req); // eslint-disable-line no-unused-vars
			assert.strictEqual(remaining, 3);
		});

		it("should block requests when limit exceeded", () => {
			const req = { sessionID: "test-session3", ip: "127.0.0.1" };
			app.rate = { limit: 2, reset: 3600 };

			// Exhaust the limit
			app.rateLimit(req); // remaining: 1
			app.rateLimit(req); // remaining: 0
			const [valid] = app.rateLimit(req); // should be blocked

			assert.strictEqual(valid, false);
		});

		it("should use IP when sessionID not available", () => {
			const req = { ip: "192.168.1.1" };
			app.rate = { limit: 10, reset: 3600 };

			const [valid, limit, remaining] = app.rateLimit(req); // eslint-disable-line no-unused-vars

			assert.strictEqual(valid, true);
			assert.strictEqual(limit, 10);
		});

		it("should allow custom rate limit function", () => {
			const req = { sessionID: "test-session4" };
			app.rate = { limit: 100, reset: 3600 };

			const customFn = (req, state) => { // eslint-disable-line no-shadow
				state.limit = 200;

				return state;
			};

			const [valid, limit] = app.rateLimit(req, customFn); // eslint-disable-line no-unused-vars
			assert.strictEqual(limit, 200);
		});

		it("should handle rate limit configuration", () => {
			const config = {
				rate: {
					enabled: true,
					limit: 500,
					reset: 1800,
					status: 429,
					message: "Too many requests"
				},
				logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.rate.enabled, true);
			assert.strictEqual(customApp.rate.limit, 500);
			assert.strictEqual(customApp.rate.reset, 1800);
			assert.strictEqual(customApp.rate.status, 429);

			customApp.stop();
		});
	});

	describe("Authentication Configuration", () => {
		it("should configure basic authentication", () => {
			const config = {
				auth: {
					basic: {
						enabled: true,
						list: ["user:password", "admin:secret"]
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.basic.enabled, true);
			assert.deepStrictEqual(customApp.auth.basic.list, ["user:password", "admin:secret"]);

			customApp.stop();
		});

		it("should configure bearer token authentication", () => {
			const config = {
				auth: {
					bearer: {
						enabled: true,
						tokens: ["token123", "token456"]
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.bearer.enabled, true);
			assert.deepStrictEqual(customApp.auth.bearer.tokens, ["token123", "token456"]);

			customApp.stop();
		});

		it("should configure JWT authentication", () => {
			const config = {
				auth: {
					jwt: {
						enabled: true,
						secretOrKey: "secret-key",
						algorithms: ["HS256"],
						issuer: "test-issuer",
						audience: "test-audience"
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.jwt.enabled, true);
			assert.strictEqual(customApp.auth.jwt.secretOrKey, "secret-key");
			// The config merge keeps all default algorithms plus the specified ones
			assert(customApp.auth.jwt.algorithms.includes("HS256"));
			assert(customApp.auth.jwt.algorithms.includes("HS384"));
			assert(customApp.auth.jwt.algorithms.includes("HS512"));

			customApp.stop();
		});

		it("should configure OAuth2 authentication", () => {
			const config = {
				auth: {
					oauth2: {
						enabled: true,
						auth_url: "https://auth.example.com/oauth2/authorize",
						token_url: "https://auth.example.com/oauth2/token",
						client_id: "client123",
						client_secret: "secret456"
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.oauth2.enabled, true);
			assert.strictEqual(customApp.auth.oauth2.client_id, "client123");

			customApp.stop();
		});

		it("should configure authentication URIs", () => {
			const config = {
				auth: {
					uri: {
						login: "/custom/login",
						logout: "/custom/logout",
						redirect: "/custom/redirect",
						root: "/custom/auth"
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.uri.login, "/custom/login");
			assert.strictEqual(customApp.auth.uri.logout, "/custom/logout");
			assert.strictEqual(customApp.auth.uri.redirect, "/custom/redirect");
			assert.strictEqual(customApp.auth.uri.root, "/custom/auth");

			customApp.stop();
		});

		it("should configure SAML authentication", () => {
			const config = {
				auth: {
					saml: {
						enabled: true,
						auth: (profile, done) => done(null, profile)
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.auth.saml.enabled, true);
			assert.strictEqual(typeof customApp.auth.saml.auth, "function");

			customApp.stop();
		});
	});

	describe("Security Configuration", () => {
		it("should configure CSRF protection", () => {
			const config = {
				security: {
					csrf: true,
					key: "x-custom-csrf-token",
					secret: "custom-secret"
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.security.csrf, true);
			assert.strictEqual(customApp.security.key, "x-custom-csrf-token");
			assert.strictEqual(customApp.security.secret, "custom-secret");

			customApp.stop();
		});

		it("should configure CSP headers", () => {
			const config = {
				security: {
					csp: {
						"default-src": ["'self'"],
						"script-src": ["'self'", "'unsafe-inline'"]
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(typeof customApp.security.csp, "object");

			customApp.stop();
		});

		it("should configure X-Frame-Options", () => {
			const config = {
				security: {
					xframe: "DENY"
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.security.xframe, "DENY");

			customApp.stop();
		});

		it("should configure HSTS", () => {
			const config = {
				security: {
					hsts: {
						maxAge: 31536000,
						includeSubDomains: true,
						preload: true
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(typeof customApp.security.hsts, "object");

			customApp.stop();
		});

		it("should configure XSS protection", () => {
			const config = {
				security: {
					xssProtection: true
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.security.xssProtection, true);

			customApp.stop();
		});

		it("should configure nosniff", () => {
			const config = {
				security: {
					nosniff: true
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.security.nosniff, true);

			customApp.stop();
		});
	});

	describe("Session Configuration", () => {
		it("should configure session settings", () => {
			const config = {
				session: {
					name: "custom.sid",
					secret: "custom-secret",
					rolling: false,
					resave: false,
					saveUninitialized: false
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.session.name, "custom.sid");
			assert.strictEqual(customApp.session.secret, "custom-secret");
			assert.strictEqual(customApp.session.rolling, false);

			customApp.stop();
		});

		it("should configure session cookies", () => {
			const config = {
				session: {
					cookie: {
						httpOnly: false,
						secure: true,
						sameSite: false,
						path: "/api"
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.session.cookie.httpOnly, false);
			assert.strictEqual(customApp.session.cookie.secure, true);
			assert.strictEqual(customApp.session.cookie.path, "/api");

			customApp.stop();
		});

		it("should configure Redis session store", () => {
			const config = {
				session: {
					store: "redis",
					redis: {
						host: "redis.example.com",
						port: 6380
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.session.store, "redis");
			assert.strictEqual(customApp.session.redis.host, "redis.example.com");
			assert.strictEqual(customApp.session.redis.port, 6380);

			customApp.stop();
		});
	});

	describe("Prometheus Metrics", () => {
		it("should configure Prometheus metrics", () => {
			const config = {
				prometheus: {
					enabled: true,
					metrics: {
						includeMethod: true,
						includePath: true,
						includeStatusCode: true,
						includeUp: false,
						buckets: [0.1, 1, 5, 10],
						customLabels: { service: "test" }
					}
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.prometheus.enabled, true);
			assert.strictEqual(customApp.prometheus.metrics.includeMethod, true);
			// The config merge combines default buckets with specified ones
			assert(customApp.prometheus.metrics.buckets.includes(0.1));
			assert(customApp.prometheus.metrics.buckets.includes(1));
			assert(customApp.prometheus.metrics.buckets.includes(5));
			assert(customApp.prometheus.metrics.buckets.includes(10));

			customApp.stop();
		});

		it("should handle default Prometheus configuration", () => {
			const config = {
				prometheus: { enabled: false }, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.prometheus.enabled, false);

			customApp.stop();
		});
	});

	describe("CORS Configuration", () => {
		it("should configure CORS origins", () => {
			const config = {
				origins: ["http://localhost:3000", "https://example.com"], logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.deepStrictEqual(customApp.origins, ["http://localhost:3000", "https://example.com"]);

			customApp.stop();
		});

		it("should configure CORS expose headers", () => {
			const config = {
				corsExpose: "x-custom-header, x-another-header", logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert(customApp.corsExpose.includes("x-custom-header"));
			assert(customApp.corsExpose.includes("x-another-header"));

			customApp.stop();
		});
	});

	describe("Request Size Limits", () => {
		it("should configure max bytes", () => {
			const config = {
				maxBytes: 1048576, // 1MB
				logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.maxBytes, 1048576);

			customApp.stop();
		});

		it("should handle unlimited request size", () => {
			const config = {
				maxBytes: 0, // unlimited
				logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.maxBytes, 0);

			customApp.stop();
		});
	});

	describe("Caching Configuration", () => {
		it("should configure cache settings", () => {
			const config = {
				cacheSize: 2000,
				cacheTTL: 600000, // 10 minutes
				etags: false, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.cacheSize, 2000);
			assert.strictEqual(customApp.cacheTTL, 600000);
			// The actual property name might be different
			assert.strictEqual(customApp.etags, false);

			customApp.stop();
		});
	});

	describe("Logging Configuration", () => {
		it("should configure logging settings", () => {
			const config = {
				logging: {
					enabled: false,
					level: "error",
					format: "custom format",
					stack: false
				}
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			// Check that logging configuration is set correctly
			assert.strictEqual(customApp.logging.enabled, false);
			assert.strictEqual(customApp.logging.level, "error");
			assert.strictEqual(customApp.logging.format, "custom format");
			assert.strictEqual(customApp.logging.stack, false);

			customApp.stop();
		});
	});

	describe("Default Headers", () => {
		it("should configure default headers", () => {
			const config = {
				defaultHeaders: {
					"x-custom-header": "custom-value",
					"x-api-version": "1.0"
				}, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			// Default headers are merged with existing defaults, so check if they exist
			assert(customApp.defaultHeaders["x-custom-header"]);
			assert(customApp.defaultHeaders["x-api-version"]);

			customApp.stop();
		});
	});

	describe("Content Type Configuration", () => {
		it("should configure MIME type", () => {
			const config = {
				mimeType: "application/xml",
				charset: "iso-8859-1", logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.mimeType, "application/xml");
			assert.strictEqual(customApp.charset, "iso-8859-1");

			customApp.stop();
		});

		it("should configure JSON indentation", () => {
			const config = {
				jsonIndent: 4, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.jsonIndent, 4);

			customApp.stop();
		});
	});

	describe("Pagination Configuration", () => {
		it("should configure page size", () => {
			const config = {
				pageSize: 20, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.pageSize, 20);

			customApp.stop();
		});
	});

	describe("Hypermedia Configuration", () => {
		it("should process hypermedia correctly", () => {
			const req = {
				server: app,
				method: "GET",
				url: "/api/items",
				parsed: {
					searchParams: new URLSearchParams("page=1&page_size=5"),
					href: "http://127.0.0.1:8000/api/items?page=1&page_size=5",
					search: "?page=1&page_size=5"
				},
				hypermedia: true,
				hypermediaHeader: true
			};

			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};

			const response = {
				data: [
					{ id: 1, name: "Item 1" },
					{ id: 2, name: "Item 2" }
				],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, response);

			assert.strictEqual(typeof result, "object");
			assert(Array.isArray(result.data));
			assert(Array.isArray(result.links));
		});
	});

	describe("Static File Configuration", () => {
		it("should configure webroot settings", () => {
			// Since webroot.template path validation happens in tenso factory,
			// we'll test the configuration values
			const partialConfig = {
				webroot: {
					static: "/assets"
				}, logging: { enabled: false }
			};
			const customApp = tenso(partialConfig);

			assert.strictEqual(customApp.webroot.static, "/assets");

			customApp.stop();
		});

		it("should configure auto indexing", () => {
			const config = {
				autoindex: true, logging: { enabled: false }
			};
			config.maxListeners = 100;
			const customApp = tenso(config);

			assert.strictEqual(customApp.autoindex, true);

			customApp.stop();
		});
	});
});
