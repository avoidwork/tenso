const fs = require("fs"),
	path = require("path"),
	root = path.join(__dirname, ".."),
	cfg = require(path.join(root, "config.json")),
	tenso = require(path.join(__dirname, "tenso.js")),
	utility = require(path.join(__dirname, "utility.js"));

console.log(cfg);

function factory (arg) {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		vhosts = {},
		config = arg ? utility.merge(utility.clone(cfg), arg) : utility.clone(cfg),
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
	obj = tenso(config);
	obj.hostname = hostname;

	return utility.bootstrap(obj, config);
}

module.exports = factory;
