import {readFileSync} from "node:fs";
import { createRequire } from "node:module";
import {join, resolve} from "node:path";
import {fileURLToPath, URL} from "node:url";
import {Woodland} from "woodland";
import defaults from "defaults";
import {config as defaultConfig} from "./utils/config.js";
import {parsers} from "./utils/parsers.js";
import {renderers} from "./utils/renderers.js";
import {serializers} from "./utils/serializers.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const {version} = require(join(__dirname, "..", "..", "package.json"));

class Tenso extends Woodland {
	constructor (config = defaultConfig) {
		super(config);
		this.config = config;
		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers;
		this.serializers = serializers;
		this.server = null;
		this.version = config.version;
	}

	bootstrap () {}

	start () {}

	stop () {}
}

export function tenso (userConfig = {}) {
	const config = defaults(userConfig, structuredClone(defaultConfig));

	if ((/^[^\d+]$/).test(config.port) && config.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	config.webroot.root = resolve(config.webroot.root || join(__dirname, "www"));
	config.webroot.template = readFileSync(config.webroot.template || join(config.webroot.root, "template.html"), {encoding: "utf8"});

	if (config.silent !== true) {
		config.defaultHeaders.server = `tenso/${version}`;
		config.defaultHeaders["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config);

	process.on("SIGTERM", async () => {
		await app.server.close();
		process.exit(0);
	});

	return app.bootstrap().start();
}
