import {woodland} from "woodland";
import {join} from "path";
import {hypermedia} from "./regex.js";
import {serialize} from "./serialize.js";
import {parse, payload} from "./middleware.js";
import {auth} from "./auth.js";

export function bootstrap (obj) {
	const authorization = Object.keys(obj.config.auth).filter(i => {
		const x = obj.config.auth[i];

		return x instanceof Object && x.enabled === true;
	}).length > 0 || obj.config.rate.enabled || obj.config.security.csrf;

	obj.version = obj.config.version;

	// Creating router
	obj.router = woodland({
		cacheSize: obj.config.cacheSize,
		cacheTTL: obj.config.cacheTTL,
		corsExpose: obj.config.corsExpose,
		defaultHeaders: obj.config.headers,
		indexes: obj.config.index,
		logging: obj.config.logging,
		origins: obj.config.origins,
		sendError: true,
		time: true
	});

	// Setting up router
	obj.router.addListener("connect", obj.connect.bind(obj));
	obj.router.onsend = (req, res, body = "", status = 200, headers) => {
		obj.headers(req, res);
		res.statusCode = status;

		if (status !== 204 && status !== 304 && (body === null || typeof body.on !== "function")) {
			body = obj.render(req, res, obj.final(req, res, hypermedia(req, res, serialize(req, res, body)))); // eslint-disable-line no-use-before-define
		}

		return [body, status, headers];
	};

	// Payload handling
	obj.always(payload).ignore(payload);
	obj.always(parse).ignore(parse);

	// Setting 'always' routes before authorization runs
	for (const [key, value] of Object.entries(obj.config.routes.always ?? {})) {
		if (typeof value === "function") {
			obj.always(key, value).ignore(value);
		}
	}

	delete obj.config.routes.always;

	if (authorization) {
		auth(obj, obj.config);
	}

	// Static assets on disk for browsable interface
	if (obj.config.static !== "") {
		obj.router.staticFiles(join(__dirname, "..", "www", obj.config.static));
	}

	// Setting routes
	for (const [method, routes] of Object.entries(obj.config.routes ?? {})) {
		for (const [route, target] of Object.entries(routes ?? {})) {
			if (typeof target === "function") {
				obj[method](route, target);
			} else {
				obj[method](route, (req, res) => res.send(target));
			}
		}
	}

	return obj;
}
