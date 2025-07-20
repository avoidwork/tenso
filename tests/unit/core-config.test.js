import assert from "node:assert";
import { config } from "../../src/core/config.js";

describe("core/config", () => {
	it("should be an object", () => {
		assert.strictEqual(typeof config, "object");
		assert.strictEqual(config !== null, true);
	});

	it("should have a version property", () => {
		assert.ok(Object.prototype.hasOwnProperty.call(config, "version"));
		assert.strictEqual(typeof config.version, "string");
		assert.ok(config.version.length > 0);
	});

	it("should have a title property", () => {
		assert.ok(Object.prototype.hasOwnProperty.call(config, "title"));
		assert.strictEqual(typeof config.title, "string");
		assert.strictEqual(config.title, "tenso");
		assert.ok(config.title.length > 0);
	});

	it("should have all required top-level properties", () => {
		const requiredProperties = [
			"auth",
			"autoindex",
			"cacheSize",
			"cacheTTL",
			"catchAll",
			"charset",
			"corsExpose",
			"defaultHeaders",
			"digit",
			"etags",
			"exit",
			"host",
			"hypermedia",
			"index",
			"initRoutes",
			"jsonIndent",
			"logging",
			"maxBytes",
			"maxListeners",
			"mimeType",
			"origins",
			"pageSize",
			"port",
			"prometheus",
			"rate",
			"renderHeaders",
			"time",
			"title",
			"security",
			"session",
			"silent",
			"ssl",
			"webroot",
			"version"
		];

		requiredProperties.forEach(prop => {
			assert.ok(Object.prototype.hasOwnProperty.call(config, prop), `Config should have ${prop} property`);
		});
	});

	it("should have properly structured auth configuration", () => {
		assert.strictEqual(typeof config.auth, "object");
		assert.strictEqual(typeof config.auth.delay, "number");
		assert.ok(Array.isArray(config.auth.protect));
		assert.ok(Array.isArray(config.auth.unprotect));
		assert.strictEqual(typeof config.auth.basic, "object");
		assert.strictEqual(typeof config.auth.bearer, "object");
		assert.strictEqual(typeof config.auth.jwt, "object");
		assert.strictEqual(typeof config.auth.oauth2, "object");
		assert.strictEqual(typeof config.auth.saml, "object");
		assert.strictEqual(typeof config.auth.uri, "object");
		assert.strictEqual(typeof config.auth.msg, "object");
	});

	it("should have properly structured security configuration", () => {
		assert.strictEqual(typeof config.security, "object");
		assert.strictEqual(typeof config.security.key, "string");
		assert.strictEqual(typeof config.security.secret, "string");
		assert.strictEqual(typeof config.security.csrf, "boolean");
		assert.strictEqual(typeof config.security.xframe, "string");
		assert.strictEqual(typeof config.security.p3p, "string");
		assert.strictEqual(typeof config.security.xssProtection, "boolean");
		assert.strictEqual(typeof config.security.nosniff, "boolean");
	});

	it("should have properly structured session configuration", () => {
		assert.strictEqual(typeof config.session, "object");
		assert.strictEqual(typeof config.session.cookie, "object");
		assert.strictEqual(typeof config.session.name, "string");
		assert.strictEqual(typeof config.session.proxy, "boolean");
		assert.strictEqual(typeof config.session.redis, "object");
		assert.strictEqual(typeof config.session.rolling, "boolean");
		assert.strictEqual(typeof config.session.resave, "boolean");
		assert.strictEqual(typeof config.session.saveUninitialized, "boolean");
		assert.strictEqual(typeof config.session.secret, "string");
		assert.strictEqual(typeof config.session.store, "string");
	});

	it("should have properly structured webroot configuration", () => {
		assert.strictEqual(typeof config.webroot, "object");
		assert.strictEqual(typeof config.webroot.root, "string");
		assert.strictEqual(typeof config.webroot.static, "string");
		assert.strictEqual(typeof config.webroot.template, "string");
	});

	it("should have proper default values for common properties", () => {
		assert.strictEqual(config.port, 8000);
		assert.strictEqual(config.host, "0.0.0.0");
		assert.strictEqual(config.cacheSize, 1000);
		assert.strictEqual(config.cacheTTL, 300000);
		assert.strictEqual(config.pageSize, 5);
		assert.strictEqual(config.jsonIndent, 0);
		assert.strictEqual(config.maxListeners, 25);
		assert.strictEqual(config.charset, "utf-8");
		assert.strictEqual(config.catchAll, true);
		assert.strictEqual(config.etags, true);
		assert.strictEqual(config.silent, false);
		assert.strictEqual(config.autoindex, false);
		assert.strictEqual(config.renderHeaders, true);
		assert.strictEqual(config.time, true);
		assert.strictEqual(config.title, "tenso");
	});

	it("should have properly structured logging configuration", () => {
		assert.strictEqual(typeof config.logging, "object");
		assert.strictEqual(typeof config.logging.enabled, "boolean");
		assert.strictEqual(typeof config.logging.format, "string");
		assert.strictEqual(typeof config.logging.level, "string");
		assert.strictEqual(typeof config.logging.stack, "boolean");
		assert.strictEqual(config.logging.enabled, true);
		assert.strictEqual(config.logging.stack, true);
	});

	it("should have properly structured prometheus configuration", () => {
		assert.strictEqual(typeof config.prometheus, "object");
		assert.strictEqual(typeof config.prometheus.enabled, "boolean");
		assert.strictEqual(typeof config.prometheus.metrics, "object");
		assert.strictEqual(typeof config.prometheus.metrics.includeMethod, "boolean");
		assert.strictEqual(typeof config.prometheus.metrics.includePath, "boolean");
		assert.strictEqual(typeof config.prometheus.metrics.includeStatusCode, "boolean");
		assert.strictEqual(typeof config.prometheus.metrics.includeUp, "boolean");
		assert.ok(Array.isArray(config.prometheus.metrics.buckets));
		assert.strictEqual(typeof config.prometheus.metrics.customLabels, "object");
	});

	it("should have properly structured rate limiting configuration", () => {
		assert.strictEqual(typeof config.rate, "object");
		assert.strictEqual(typeof config.rate.enabled, "boolean");
		assert.strictEqual(typeof config.rate.limit, "number");
		assert.strictEqual(typeof config.rate.message, "string");
		assert.strictEqual(typeof config.rate.reset, "number");
		assert.strictEqual(typeof config.rate.status, "number");
		assert.strictEqual(config.rate.limit, 450);
		assert.strictEqual(config.rate.reset, 900);
		assert.strictEqual(config.rate.status, 429);
	});

	it("should have properly structured SSL configuration", () => {
		assert.strictEqual(typeof config.ssl, "object");
		assert.strictEqual(config.ssl.cert, null);
		assert.strictEqual(config.ssl.key, null);
		assert.strictEqual(config.ssl.pfx, null);
	});

	it("should have properly structured hypermedia configuration", () => {
		assert.strictEqual(typeof config.hypermedia, "object");
		assert.strictEqual(typeof config.hypermedia.enabled, "boolean");
		assert.strictEqual(typeof config.hypermedia.header, "boolean");
		assert.strictEqual(config.hypermedia.enabled, true);
		assert.strictEqual(config.hypermedia.header, true);
	});

	it("should have proper array properties", () => {
		assert.ok(Array.isArray(config.exit));
		assert.ok(Array.isArray(config.index));
		assert.ok(Array.isArray(config.origins));
		assert.strictEqual(config.exit.length, 0);
		assert.strictEqual(config.index.length, 0);
		assert.strictEqual(config.origins.length, 1);
		assert.strictEqual(config.origins[0], "*");
	});

	it("should have proper object properties", () => {
		assert.strictEqual(typeof config.defaultHeaders, "object");
		assert.strictEqual(typeof config.initRoutes, "object");
		assert.ok(Object.prototype.hasOwnProperty.call(config.defaultHeaders, "content-type"));
		assert.ok(Object.prototype.hasOwnProperty.call(config.defaultHeaders, "vary"));
	});
});
