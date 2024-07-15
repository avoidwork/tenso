import {join} from "node:path";
import {hypermedia} from "./hypermedia.js";
import {serialize} from "./serialize.js";
import {auth} from "./auth.js";
import {parse} from "../middleware/parse.js";
import {payload} from "../middleware/payload.js";

export function bootstrap (obj) {
	const authorization = Object.keys(obj.config.auth).filter(i => {
		const x = obj.config.auth[i];

		return x instanceof Object && x.enabled === true;
	}).length > 0 || obj.config.rate.enabled || obj.config.security.csrf;

	obj.version = obj.config.version;

	// Setting up router
	obj.addListener("connect", obj.connect.bind(obj));
	obj.onsend = (req, res, body = "", status = 200, headers) => {
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
		obj.staticFiles(join(__dirname, "..", "www", obj.config.static));
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
