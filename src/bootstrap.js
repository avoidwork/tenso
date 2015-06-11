/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap (obj, config) {
	let notify = false;

	function mediator (req, res, next) {
		res.error = function (status, body) {
			return obj.error(req, res, status, body);
		};

		res.redirect = function (uri) {
			return obj.redirect(req, res, uri);
		};

		res.respond = function (body, status, headers) {
			return obj.respond(req, res, body, status, headers);
		};

		next();
	}

	function parse (req, res, next) {
		let args, type;

		if (REGEX.body.test(req.method) && req.body !== undefined) {
			type = req.headers["content-type"];

			if (REGEX.encode_form.test(type)) {
				args = req.body ? array.chunk(req.body.split(REGEX.body_split), 2) : [];
				req.body = {};

				array.each(args, function (i) {
					req.body[i[0]] = coerce(i[1]);
				});
			}

			if (REGEX.encode_json.test(type)) {
				req.body = json.decode(req.body, true) || req.body;
			}
		}

		next();
	}

	obj.server.use(mediator).blacklist(mediator);
	obj.server.use(parse).blacklist(parse);

	// Bootstrapping configuration
	auth(obj, config);
	config.headers = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate(obj.server.codes, function (value, key) {
		obj.messages[value] = obj.server.messages[key];
	});

	// Setting routes
	iterate(config.routes, function (routes, method) {
		iterate(routes, function (arg, route) {
			if (typeof arg === "function") {
				obj.server[method](route, function (...args) {
					arg.apply(obj, args);
				});
			} else {
				obj.server[method](route, function (req, res) {
					obj.respond(req, res, arg);
				});
			}
		});
	});

	// Disabling compression over SSL due to BREACH
	if (config.ssl.cert && config.ssl.key) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start(config, function (req, res, status, msg) {
		let stat = status instanceof Error ? parseInt(status.message, 10) : status,
			err = msg instanceof Error ? msg : new Error(msg || obj.messages[stat]);

		error(obj, req, res, stat, err, obj);
	});

	if (notify) {
		obj.server.log("Compression over SSL is disabled for your protection", "debug");
	}

	return obj;
}
