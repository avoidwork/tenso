"use strict";

const fs = require("fs"),
	path = require("path"),
	merge = require("tiny-merge"),
	root = __dirname,
	pkg = require(path.join(root, "package.json")),
	cfg = require(path.join(root, "config.json")),
	tenso = require(path.join(root, "lib", "tenso.js")),
	utility = require(path.join(root, "lib", "utility.js"));

function factory (arg) {
	const hostname = arg ? arg.hostname || "localhost" : "localhost",
		hosts = {},
		config = arg ? merge(utility.clone(cfg), arg) : utility.clone(cfg);

	let obj;

	if (isNaN(config.port) || config.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	if (config.root === void 0) {
		config.root = root;
	}

	if (config.hosts === void 0) {
		hosts[hostname] = "www";
		config.hosts = hosts;
	}

	if (config.default === void 0) {
		config.default = hostname;
	}

	if (config.routes.get === void 0) {
		config.routes.get = {};
	}

	config.routes.get[config.static] = (req, res) => {
		res.header("cache-control", "public, max-age=" + (config.staticCache || 300));
		req.server.static(req, res);
	};

	config.root = path.resolve(config.root);
	config.template = fs.readFileSync(config.template || path.join(config.root, "template.html"), {encoding: "utf8"});
	config.version = pkg.version;
	obj = tenso();
	utility.merge(obj.config, config);
	obj.hostname = hostname;

	return utility.bootstrap(obj, config).start();
}

module.exports = factory;
