const fs = require("fs"),
	path = require("path"),
	merge = require("tiny-merge"),
	root = path.join(__dirname, ".."),
	cfg = require(path.join(root, "config.json")),
	tenso = require(path.join(__dirname, "tenso.js")),
	utility = require(path.join(__dirname, "utility.js"));

function factory (arg) {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		vhosts = {},
		config = arg ? merge(utility.clone(cfg), arg) : utility.clone(cfg),
		obj;

	if (!config.port) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	vhosts[hostname] = "www";
	config.root = root;
	config.vhosts = vhosts;
	config.default = hostname;
	config.template = fs.readFileSync(path.join(config.root, "template.html"), {encoding: "utf8"});
	obj = tenso();
	obj.hostname = hostname;
	utility.bootstrap(obj, config);
	obj.server.start(config);

	return obj;
}

module.exports = factory;
