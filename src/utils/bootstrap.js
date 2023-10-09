const woodland = require("woodland");
const path = require("path");

function bootstrap (obj) {
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
	obj.always(middleware.payload).ignore(middleware.payload);
	obj.always(middleware.parse).ignore(middleware.parse);

	// Setting 'always' routes before authorization runs
	const routes = obj.config.routes.always || {};

	for (const i of Object.keys(routes)) {
		if (typeof routes[i] === "function") {
			obj.always(i, routes[i]).ignore(routes[i]);
		}
	}

	delete obj.config.routes.always;

	if (authorization) {
		auth(obj, obj.config);
	}

	// Static assets on disk for browseable interface
	if (obj.config.static !== "") {
		const spath = obj.config.static.endsWith("/") ? obj.config.static.replace(/\/$/, "") : obj.config.static,
			sfolder = path.join(__dirname, "..", "www", obj.config.static),
			sregex = new RegExp(`${spath.replace(/\//g, "\\/")}(\\/)?`);

		obj.config.routes.get[`${spath}(/.*)?`] = (req, res) => req.server.router.serve(req, res, req.url.replace(sregex, ""), sfolder);
	}

	// Setting routes
	for (const method of Object.keys(obj.config.routes)) {
		const lroutes = obj.config.routes[method];

		for (const i of Object.keys(lroutes)) {
			if (typeof lroutes[i] === "function") {
				obj[method](i, lroutes[i]);
			} else {
				obj[method](i, (req, res) => res.send(lroutes[i]));
			}
		}
	}

	return obj;
}
