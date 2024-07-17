import {join} from "node:path";
import {hypermedia} from "./hypermedia.js";
import {serialize} from "./serialize.js";
import {auth} from "./auth.js";
import {parse} from "../middleware/parse.js";
import {payload} from "../middleware/payload.js";
import {CONNECT, EMPTY, FUNCTION, INT_200, INT_204, INT_304} from "./constants.js";

export function bootstrap (obj) {
	const authorization = Object.keys(obj.config.auth).filter(i => obj.config.auth?.[i]?.enabled === true).length > 0 || obj.config.rate.enabled || obj.config.security.csrf;

	obj.version = obj.config.version;
	obj.addListener(CONNECT, obj.connect.bind(obj));
	obj.onsend = (req, res, body = EMPTY, status = INT_200, headers) => {
		obj.headers(req, res);
		res.statusCode = status;

		if (status !== INT_204 && status !== INT_304 && (body === null || typeof body.on !== FUNCTION)) {
			for (const fn of [serialize, hypermedia, obj.final, obj.render]) {
				body = fn(req, res, body);
			}
		}

		return [body, status, headers];
	};

	// Payload handling
	obj.always(payload).ignore(payload);
	obj.always(parse).ignore(parse);

	// Setting 'always' routes before authorization runs
	for (const [key, value] of Object.entries(obj.config.routes.always ?? {})) {
		if (typeof value === FUNCTION) {
			obj.always(key, value).ignore(value);
		}
	}

	delete obj.config.routes.always;

	if (authorization) {
		auth(obj, obj.config);
	}

	// Static assets on disk for browsable interface
	if (obj.config.static !== EMPTY) {
		obj.staticFiles(join(__dirname, "..", "www", obj.config.static));
	}

	// Setting routes
	for (const [method, routes] of Object.entries(obj.config.routes ?? {})) {
		for (const [route, target] of Object.entries(routes ?? {})) {
			if (typeof target === FUNCTION) {
				obj[method](route, target);
			} else {
				obj[method](route, (req, res) => res.send(target));
			}
		}
	}

	return obj;
}
