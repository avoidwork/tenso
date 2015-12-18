const path = require("path"),
	root = path.join(__dirname, ".."),
	cfg = require(path.join(root, "config.json")),
	Tenso = require(path.join(__dirname, "tenso.js"));
	utility = require(path.join(__dirname, "utility.js"));

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
	obj = new Tenso();
	obj.hostname = hostname;

	return utility.bootstrap(obj, config);
}

factory.version = "{{VERSION}}";

module.exports = factory;
