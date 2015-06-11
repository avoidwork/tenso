/**
 * Keymaster for the request
 *
 * @method keymaster
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
function keymaster (req, res, next) {
	let obj = req.server.tenso,
		method, result, routes, uri, valid;

	// No authentication, or it's already happened
	if (!req.protect || !req.protectAsync || (req.session && req.isAuthenticated())) {
		method = REGEX.get_rewrite.test(req.method) ? "get" : req.method.toLowerCase();
		routes = req.server.config.routes[method] || {};
		uri = req.parsed.pathname;
		valid = false;

		rate(obj, req, res, function () {
			if (uri in routes) {
				result = routes[uri];

				if (typeof result === "function") {
					result.call(obj, req, res);
				} else {
					obj.respond(req, res, result);
				}
			} else {
				iterate(routes, function (value, key) {
					if (new RegExp("^" + key + "$", "i").test(uri)) {
						result = value;

						return false;
					}
				});

				if (result) {
					if (typeof result === "function") {
						result.call(obj, req, res);
					} else {
						obj.respond(req, res, result);
					}
				} else {
					iterate(req.server.config.routes.get || {}, function (value, key) {
						if (new RegExp("^" + key + "$", "i").test(uri)) {
							valid = true;

							return false;
						}
					});

					if (valid) {
						obj.error(req, res, 405);
					} else {
						obj.error(req, res, 404);
					}
				}
			}
		});
	} else {
		rate(obj, req, res, next);
	}
}
