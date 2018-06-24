"use strict";

const fs = require("fs"),
	path = require("path"),
	merge = require("tiny-merge"),
	{each} = require("retsu"),
	root = __dirname,
	pkg = require(path.join(root, "package.json")),
	regex = require(path.join(root, "lib", "regex.js")),
	tenso = require(path.join(root, "lib", "tenso.js")),
	{bootstrap} = require(path.join(root, "lib", "utility.js"));

function factory (config = {}) {
	const obj = tenso();

	if (isNaN(config.port) === false && config.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	obj.config.root = path.resolve(config.root || obj.config.root);
	obj.config.template = fs.readFileSync(config.template || path.join(obj.config.root, "template.html"), {encoding: "utf8"});
	obj.config.version = pkg.version;
	merge(obj.config, config);

	each(Object.keys(config.regex || {}), key => {
		regex[key] = new RegExp(config.regex[key], "i");
	});

	if (obj.config.silent === false) {
		obj.config.headers.server = `tenso/${pkg.version}`;
		obj.config.headers["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`
	}

	return bootstrap(obj).start();
}

module.exports = factory;
