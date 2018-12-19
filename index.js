"use strict";

const fs = require("fs"),
	path = require("path"),
	merge = require("tiny-merge"),
	args = require("yargs").argv,
	root = __dirname,
	pkg = require(path.join(root, "package.json")),
	regex = require(path.join(root, "lib", "regex.js")),
	tenso = require(path.join(root, "lib", "tenso.js")),
	{bootstrap, each} = require(path.join(root, "lib", "utility.js"));

// Removing default properties
delete args._;
delete args.$0;

each(Object.keys(args), k => {
	const result = args[k];

	if (typeof result === "string" && regex.jsonWrap.test(result)) {
		try {
			args[k] = JSON.parse(result);
		} catch (err) {
			args[k] = result;
		}
	}
});

function factory (config = {}) {
	const obj = tenso();

	if (isNaN(config.port) === false && config.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	if (Object.keys(args).length > 0) {
		merge(config, args || {});
	}

	merge(obj.config, config);

	obj.config.root = path.resolve(config.root || path.join(__dirname, "www"));
	obj.config.template = fs.readFileSync(config.template || path.join(__dirname, "template.html"), {encoding: "utf8"});
	obj.config.version = pkg.version;

	if (obj.config.silent !== true) {
		obj.config.headers.server = `tenso/${pkg.version}`;
		obj.config.headers["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	return bootstrap(obj).start();
}

module.exports = factory;
