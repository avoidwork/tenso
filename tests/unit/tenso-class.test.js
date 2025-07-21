import {strict as assert} from "node:assert";
import {Tenso} from "../../src/tenso.js";

describe("Tenso class", () => {
	let server;

	afterEach(() => {
		if (server?.server) {
			server.stop();
		}
	});

	describe("constructor", () => {
		it("should create instance with default config", () => {
			server = new Tenso();
			assert.ok(server instanceof Tenso);
			assert.ok(server.parsers);
			assert.ok(server.rates instanceof Map);
			assert.ok(server.renderers);
			assert.ok(server.serializers);
			assert.strictEqual(server.server, null);
			assert.ok(server.version);
		});

		it("should merge custom config with defaults", () => {
			const customConfig = {
				port: 9999,
				title: "Custom Server"
			};
			server = new Tenso(customConfig);
			assert.strictEqual(server.port, 9999);
			assert.strictEqual(server.title, "Custom Server");
		});

		it("should not overwrite method names with config", () => {
			const customConfig = {
				serialize: "custom",
				canModify: "custom",
				connect: "custom",
				render: "custom",
				init: "custom",
				parser: "custom",
				renderer: "custom",
				serializer: "custom"
			};
			server = new Tenso(customConfig);
			assert.strictEqual(typeof server.serialize, "function");
			assert.strictEqual(typeof server.canModify, "function");
			assert.strictEqual(typeof server.connect, "function");
			assert.strictEqual(typeof server.render, "function");
			assert.strictEqual(typeof server.init, "function");
			assert.strictEqual(typeof server.parser, "function");
			assert.strictEqual(typeof server.renderer, "function");
			assert.strictEqual(typeof server.serializer, "function");
		});

		it("should apply non-method config properties", () => {
			const customConfig = {
				customProperty: "test value",
				anotherProperty: 42
			};
			server = new Tenso(customConfig);
			assert.strictEqual(server.customProperty, "test value");
			assert.strictEqual(server.anotherProperty, 42);
		});
	});

	describe("canModify method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should return true for DELETE method", () => {
			assert.strictEqual(server.canModify("DELETE"), true);
		});

		it("should return true for POST method", () => {
			assert.strictEqual(server.canModify("POST"), true);
		});

		it("should return true for PUT method", () => {
			assert.strictEqual(server.canModify("PUT"), true);
		});

		it("should return true for PATCH method", () => {
			assert.strictEqual(server.canModify("PATCH"), true);
		});

		it("should return false for GET method", () => {
			assert.strictEqual(server.canModify("GET"), false);
		});

		it("should return false for HEAD method", () => {
			assert.strictEqual(server.canModify("HEAD"), false);
		});

		it("should return false for OPTIONS method", () => {
			assert.strictEqual(server.canModify("OPTIONS"), false);
		});

		it("should handle string containing DELETE", () => {
			assert.strictEqual(server.canModify("DELETE something"), true);
		});
	});

	describe("serialize method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should delegate to serialize utility", () => {
			const req = {
				headers: {accept: "application/json"},
				server: {mimeType: "application/json"},
				parsed: {searchParams: new URLSearchParams()}
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = {test: "data"};

			const result = server.serialize(req, res, data);
			assert.strictEqual(result, data);
		});
	});

	describe("hypermedia method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should delegate to hypermedia utility", () => {
			const req = {
				parsed: {
					pathname: "/test",
					searchParams: new URLSearchParams(),
					search: ""
				},
				method: "GET",
				url: "/test",
				server: {pageSize: 5}
			};
			const res = {
				statusCode: 200,
				getHeaders: () => ({})
			};
			const data = {test: "data"};

			const result = server.hypermedia(req, res, data);
			assert.ok(result !== null);
		});
	});

	describe("connect method", () => {
		beforeEach(() => {
			server = new Tenso({
				security: {csrf: true, key: "x-csrf-token"},
				hypermedia: {enabled: true, header: true},
				corsExpose: ["custom-header"]
			});
		});

		it("should set request properties correctly", () => {
			const req = {
				method: "POST",
				parsed: {pathname: "/test"},
				cors: false
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			server.connect(req, res);

			assert.strictEqual(req.csrf, true);
			assert.strictEqual(req.hypermedia, true);
			assert.strictEqual(req.hypermediaHeader, true);
			assert.strictEqual(req.private, false);
			assert.strictEqual(req.protect, false);
			assert.strictEqual(req.protectAsync, false);
			assert.strictEqual(req.unprotect, false);
			assert.strictEqual(req.url, "/test");
			assert.strictEqual(req.server, server);
		});

		it("should handle CORS OPTIONS request", () => {
			const req = {
				method: "OPTIONS",
				parsed: {pathname: "/test"},
				cors: true,
				csrf: true
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			server.connect(req, res);
			assert.ok(req.server === server);
		});

		it("should handle CORS non-OPTIONS request", () => {
			const req = {
				method: "GET",
				parsed: {pathname: "/test"},
				cors: true,
				csrf: false
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			server.connect(req, res);
			assert.ok(req.server === server);
		});

		it("should set csrf false when canModify returns false", () => {
			const req = {
				method: "GET",
				parsed: {pathname: "/test"}
			};
			const res = {
				removeHeader: () => {},
				header: () => {}
			};

			server.connect(req, res);
			assert.strictEqual(req.csrf, false);
		});
	});

	describe("eventsource method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should delegate to eventsource utility", () => {
			const result = server.eventsource("test");
			assert.ok(result);
		});

		it("should pass all arguments", () => {
			const result = server.eventsource("test", {}, "arg3");
			assert.ok(result);
		});
	});

	describe("final method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should return the argument unchanged", () => {
			const data = {test: "data"};
			const result = server.final({}, {}, data);
			assert.strictEqual(result, data);
		});

		it("should handle null data", () => {
			const result = server.final({}, {}, null);
			assert.strictEqual(result, null);
		});

		it("should handle undefined data", () => {
			const result = server.final({}, {}, undefined);
			assert.strictEqual(result, undefined);
		});
	});

	describe("headers method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should set private cache control for protected requests", () => {
			let removedHeader;
			let setHeader;
			const req = {protect: true};
			const res = {
				getHeader: () => "public, max-age=3600",
				removeHeader: key => { removedHeader = key; },
				header: (key, value) => { setHeader = {key, value}; }
			};

			server.headers(req, res);
			assert.strictEqual(removedHeader, "cache-control");
			assert.ok(setHeader.value.startsWith("private"));
		});

		it("should set private cache control for csrf requests", () => {
			let setHeader;
			const req = {csrf: true};
			const res = {
				getHeader: () => "max-age=3600",
				removeHeader: () => {},
				header: (key, value) => { setHeader = {key, value}; }
			};

			server.headers(req, res);
			assert.ok(setHeader.value.startsWith("private"));
		});

		it("should set private cache control for private requests", () => {
			let setHeader;
			const req = {private: true};
			const res = {
				getHeader: () => "",
				removeHeader: () => {},
				header: (key, value) => { setHeader = {key, value}; }
			};

			server.headers(req, res);
			assert.ok(setHeader.value.startsWith("private"));
		});

		it("should not modify headers if not protected/csrf/private", () => {
			let headerCalled = false;
			const req = {};
			const res = {
				getHeader: () => "public, max-age=3600",
				removeHeader: () => {},
				header: () => { headerCalled = true; }
			};

			server.headers(req, res);
			assert.strictEqual(headerCalled, false);
		});

		it("should handle cache header with private already present", () => {
			let headerCalled = false;
			const req = {protect: true};
			const res = {
				getHeader: () => "private, max-age=3600",
				removeHeader: () => {},
				header: () => { headerCalled = true; }
			};

			server.headers(req, res);
			assert.strictEqual(headerCalled, false);
		});
	});

	describe("parser method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		afterEach(() => {
			// Clean up test parsers to prevent pollution
			if (server) {
				server.parsers.delete("application/custom");
				server.parsers.delete("");
				server.parsers.delete("application/test");
			}
		});

		it("should register a parser for a media type", () => {
			const parserFn = data => JSON.parse(data);
			const result = server.parser("application/custom", parserFn);

			assert.strictEqual(result, server);
			assert.strictEqual(server.parsers.get("application/custom"), parserFn);
		});

		it("should use default empty string mediatype", () => {
			const parserFn = data => data;
			server.parser(undefined, parserFn);

			assert.strictEqual(server.parsers.get(""), parserFn);
		});

		it("should use default identity function", () => {
			server.parser("application/test");
			const parser = server.parsers.get("application/test");

			assert.strictEqual(parser("test"), "test");
		});
	});

	describe("renderer method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		afterEach(() => {
			// Clean up test renderers to prevent pollution
			if (server) {
				server.renderers.delete("application/custom");
				server.renderers.delete("text/custom");
			}
		});

		it("should register a renderer for a media type", () => {
			const rendererFn = (req, res, data) => JSON.stringify(data);
			const result = server.renderer("application/custom", rendererFn);

			assert.strictEqual(result, server);
			assert.strictEqual(server.renderers.get("application/custom"), rendererFn);
		});

		it("should handle custom renderer function", () => {
			const rendererFn = (req, res, data) => `custom: ${data}`;
			server.renderer("text/custom", rendererFn);

			const renderer = server.renderers.get("text/custom");
			assert.strictEqual(renderer({}, {}, "test"), "custom: test");
		});
	});

	describe("serializer method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		afterEach(() => {
			// Clean up test serializers to prevent pollution
			if (server) {
				server.serializers.delete("application/custom");
				server.serializers.delete("application/test");
			}
		});

		it("should register a serializer for a media type", () => {
			const serializerFn = data => ({custom: data});
			const result = server.serializer("application/custom", serializerFn);

			assert.strictEqual(result, server);
			assert.strictEqual(server.serializers.get("application/custom"), serializerFn);
		});

		it("should handle custom serializer function", () => {
			const serializerFn = data => ({wrapped: data});
			server.serializer("application/test", serializerFn);

			const serializer = server.serializers.get("application/test");
			assert.deepStrictEqual(serializer("test"), {wrapped: "test"});
		});
	});

	describe("signals method", () => {
		beforeEach(() => {
			server = new Tenso();
		});

		it("should return the server instance", () => {
			const result = server.signals();
			assert.strictEqual(result, server);
		});

		it("should only set up signals once", () => {
			server.signals();
			assert.strictEqual(server.signalsDecorated, true);

			// Call again - should not set up again
			server.signals();
			assert.strictEqual(server.signalsDecorated, true);
		});
	});
});
