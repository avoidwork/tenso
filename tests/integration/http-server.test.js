import {strict as assert} from "node:assert";
import http from "node:http";
import {tenso} from "../../src/tenso.js";

describe("HTTP Server Integration", () => {
	let server;
	let port;

	afterEach(() => {
		if (server?.server) {
			server.stop();
		}
	});

	/**
	 * Helper function to start server and wait for it to be listening
	 */
	async function startServer (serverInstance) {
		serverInstance.start();
		await new Promise(resolve => {
			serverInstance.server.on("listening", () => {
				port = serverInstance.server.address().port;
				resolve();
			});
		});
	}

	/**
	 * Helper function to make HTTP requests
	 */
	function makeRequest (path, options = {}) {
		return new Promise((resolve, reject) => {
			const reqOptions = {
				hostname: "127.0.0.1",
				port: port,
				path: path,
				method: options.method || "GET",
				headers: options.headers || {}
			};

			const req = http.request(reqOptions, res => {
				let body = "";
				res.setEncoding("utf8");
				res.on("data", chunk => {
					body += chunk;
				});
				res.on("end", () => {
					resolve({
						statusCode: res.statusCode,
						headers: res.headers,
						body: body
					});
				});
			});

			req.on("error", reject);

			if (options.body) {
				req.write(options.body);
			}

			req.end();
		});
	}

	describe("Basic HTTP Server", () => {
		it("should start server and handle basic GET request", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/test", (req, res) => {
				res.send({message: "Hello World"});
			});

			await startServer(server);

			const response = await makeRequest("/test");
			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.body.includes("Hello World"));
		});

		it("should handle POST requests with JSON body", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.post("/data", (req, res) => {
				res.send({received: req.body});
			});

			await startServer(server);

			const response = await makeRequest("/data", {
				method: "POST",
				headers: {"content-type": "application/json"},
				body: JSON.stringify({test: "data"})
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.body.includes("data"));
		});

		it("should handle different content types", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/xml", (req, res) => {
				res.send({data: "test"});
			});

			await startServer(server);

			const response = await makeRequest("/xml", {
				headers: {"accept": "application/xml"}
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.headers["content-type"].includes("application/xml"));
		});

		it("should handle form-encoded data", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.post("/form", (req, res) => {
				res.send({received: req.body});
			});

			await startServer(server);

			const response = await makeRequest("/form", {
				method: "POST",
				headers: {"content-type": "application/x-www-form-urlencoded"},
				body: "name=test&value=123"
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.body.includes("test"));
		});
	});

	describe("Error Handling", () => {
		it("should return 404 for non-existent routes", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			await startServer(server);

			const response = await makeRequest("/nonexistent");
			assert.strictEqual(response.statusCode, 404);
		});

		it("should handle server errors gracefully", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/error", () => {
				throw new Error("Test error");
			});

			await startServer(server);

			const response = await makeRequest("/error");
			assert.strictEqual(response.statusCode, 500);
		});
	});

	describe("Middleware Integration", () => {
		it("should process middleware in correct order", async () => {
			const order = [];

			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.always((_req, _res, next) => {
				order.push("middleware1");
				next();
			});

			server.always((_req, _res, next) => {
				order.push("middleware2");
				next();
			});

			server.get("/middleware", (req, res) => {
				order.push("handler");
				res.send({order});
			});

			await startServer(server);

			const response = await makeRequest("/middleware");
			assert.strictEqual(response.statusCode, 200);

			const body = JSON.parse(response.body);
			assert.deepStrictEqual(body.order, ["middleware1", "middleware2", "handler"]);
		});

		it("should handle CORS requests", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				cors: {
					enabled: true,
					origin: "*"
				},
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/cors", (req, res) => {
				res.send({message: "CORS enabled"});
			});

			await startServer(server);

			const response = await makeRequest("/cors", {
				headers: {"origin": "http://example.com"}
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.headers["access-control-allow-origin"]);
		});

		it("should handle OPTIONS preflight requests", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				cors: {
					enabled: true,
					origin: "*"
				},
				webroot: {
					template: "www/template.html"
				}
			});

			await startServer(server);

			const response = await makeRequest("/test", {
				method: "OPTIONS",
				headers: {
					"origin": "http://example.com",
					"access-control-request-method": "POST"
				}
			});

			assert.strictEqual(response.statusCode, 200);
		});
	});

	describe("Response Formats", () => {
		it("should render JSON by default", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/json", (req, res) => {
				res.send({data: "test", number: 42});
			});

			await startServer(server);

			const response = await makeRequest("/json");
			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.headers["content-type"].includes("application/json"));

			const data = JSON.parse(response.body);
			assert.strictEqual(data.data, "test");
			assert.strictEqual(data.number, 42);
		});

		it("should render CSV format", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/csv", (req, res) => {
				res.send([
					{name: "John", age: 30},
					{name: "Jane", age: 25}
				]);
			});

			await startServer(server);

			const response = await makeRequest("/csv", {
				headers: {"accept": "text/csv"}
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.headers["content-type"].includes("text/csv"));
			assert.ok(response.body.includes("name,age"));
			assert.ok(response.body.includes("John,30"));
		});

		it("should render YAML format", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/yaml", (req, res) => {
				res.send({message: "Hello YAML", items: ["one", "two"]});
			});

			await startServer(server);

			const response = await makeRequest("/yaml", {
				headers: {"accept": "application/yaml"}
			});

			assert.strictEqual(response.statusCode, 200);
			assert.ok(response.headers["content-type"].includes("application/yaml"));
			assert.ok(response.body.includes("message: Hello YAML"));
		});
	});

	describe("HTTP Methods", () => {
		it("should handle PUT requests", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.put("/update", (req, res) => {
				res.send({method: "PUT", body: req.body});
			});

			await startServer(server);

			const response = await makeRequest("/update", {
				method: "PUT",
				headers: {"content-type": "application/json"},
				body: JSON.stringify({id: 1, name: "Updated"})
			});

			assert.strictEqual(response.statusCode, 200);
			const data = JSON.parse(response.body);
			assert.strictEqual(data.method, "PUT");
		});

		it("should handle DELETE requests", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.delete("/remove", (req, res) => {
				res.send({method: "DELETE", deleted: true});
			});

			await startServer(server);

			const response = await makeRequest("/remove", {
				method: "DELETE"
			});

			assert.strictEqual(response.statusCode, 200);
			const data = JSON.parse(response.body);
			assert.strictEqual(data.method, "DELETE");
		});

		it("should handle PATCH requests", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.patch("/partial", (req, res) => {
				res.send({method: "PATCH", changes: req.body});
			});

			await startServer(server);

			const response = await makeRequest("/partial", {
				method: "PATCH",
				headers: {"content-type": "application/json"},
				body: JSON.stringify({field: "new value"})
			});

			assert.strictEqual(response.statusCode, 200);
			const data = JSON.parse(response.body);
			assert.strictEqual(data.method, "PATCH");
		});
	});

	describe("Server Configuration", () => {
		it("should handle custom headers", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				defaultHeaders: {
					"x-custom-header": "test-value"
				},
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/headers", (req, res) => {
				res.send({message: "Custom headers"});
			});

			await startServer(server);

			const response = await makeRequest("/headers");
			assert.strictEqual(response.statusCode, 200);
			assert.strictEqual(response.headers["x-custom-header"], "test-value");
		});

		it("should handle server shutdown gracefully", async () => {
			server = tenso({
				port: 0,
				host: "127.0.0.1",
				webroot: {
					template: "www/template.html"
				}
			});

			server.get("/test", (req, res) => {
				res.send({message: "test"});
			});

			await startServer(server);

			const response = await makeRequest("/test");
			assert.strictEqual(response.statusCode, 200);

			server.stop();
			assert.strictEqual(server.server, null);
		});
	});
});
