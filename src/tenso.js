import {Woodland} from "woodland";
import defaults from "defaults";
import {config as defaultConfig} from "./utils/config.js";

const parsers = new Map();
const renderers = new Map();
const serializers = new Map();

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
}

export function tenso (userConfig = {}) {
	return new Tenso(defaults(userConfig, structuredClone(defaultConfig)));
}
