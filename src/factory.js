/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
function factory (arg) {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		vhosts = {},
		config = arg ? merge(clone(CONFIG), arg) : CONFIG,
		obj;

	if (!config.port) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	vhosts[hostname] = "www";
	config.root = path.join(__dirname, "..");
	config.vhosts = vhosts;
	config.default = hostname;
	config.template = fs.readFileSync(path.join(config.root, "template.html"), {encoding: "utf8"});
	obj = new Tenso();
	obj.hostname = hostname;

	return bootstrap(obj, config);
}
