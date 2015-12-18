class Tenso {
	constructor () {
		this.hostname = "";
		this.messages = {};
		this.rates = {};
		this.server = turtleio();
		this.server.tenso = this;
		this.version = VERSION;
	}

	error (req, res, status, arg) {
		this.server.error(req, res, status, arg);

		return this;
	}

	rate (req, fn) {
		let config = this.server.config.rate,
			id = req.sessionID || req.ip,
			valid = true,
			seconds = parseInt(new Date().getTime() / 1000, 10),
			limit, remaining, reset, state;

		if (!this.rates[id]) {
			this.rates[id] = {
				limit: config.limit,
				remaining: config.limit,
				reset: seconds + config.reset,
				time_reset: config.reset
			};
		}

		if (typeof fn === "function") {
			this.rates[id] = fn(req, this.rates[id]);
		}

		state = this.rates[id];
		limit = state.limit;
		remaining = state.remaining;
		reset = state.reset;

		if (seconds >= reset) {
			reset = state.reset = (seconds + config.reset);
			remaining = state.remaining = limit - 1;
		} else if (remaining > 0) {
			state.remaining--;
			remaining = state.remaining;
		} else {
			valid = false;
		}

		return [valid, limit, remaining, reset];
	}

	redirect (req, res, uri, perm = false) {
		this.server.respond(req, res, this.server.messages.NO_CONTENT, this.server.codes[!perm ? "FOUND" : "MOVED"], {location: uri});

		return this;
	}

	render (req, arg, headers) {
		let accept = req.parsed.query.format || req.headers.accept || "application/json",
			accepts = string.explode(accept, ";"),
			format = "json";

		array.each(this.server.config.renderers || [], function (i) {
			let found = false;

			array.each(accepts, function (x) {
				if (x.indexOf(i) > -1) {
					format = i;
					return !(found = true);
				}
			});

			if (found) {
				return false;
			}
		});

		headers["content-type"] = renderers[format].header;

		return renderers[format].fn(arg, req, headers, format === "html" ? this.server.config.template : undefined);
	}

	renderer (name, fn, mimetype) {
		renderers[name] = {fn: fn, header: mimetype};
		array.add(this.server.config.renderers, name);

		return this;
	}

	respond (req, res, arg, status, headers) {
		let resStatus = status || 200,
			defer = deferred(),
			ref;

		if (!res._header) {
			ref = [headers || {}];

			if (res._headers) {
				merge(ref[0], res._headers);
			}

			if (req.protect) {
				if (ref[0]["cache-control"] === undefined && this.server.config.headers["cache-control"]) {
					ref[0]["cache-control"] = clone(this.server.config.headers["cache-control"]);
				}

				if (ref[0]["cache-control"] !== undefined && ref[0]["cache-control"].indexOf("private ") === -1) {
					ref[0]["cache-control"] = "private " + ref[0]["cache-control"];
				}
			}

			if (!REGEX.modify.test(req.method) && REGEX.modify.test(req.allow) && this.server.config.security.csrf && res.locals[this.server.config.security.key]) {
				ref[0][this.server.config.security.key] = res.locals[this.server.config.security.key];
			}

			ref[0] = this.server.headers(req, ref[0], resStatus);
			this.server.respond(req, res, this.render(req, hypermedia(this.server, req, response(arg, resStatus), ref[0]), ref[0]), resStatus, ref[0]).then(function () {
				defer.resolve(true);
			}, function (e) {
				defer.reject(e);
			});
		} else {
			defer.resolve(true);
		}

		return defer.promise;
	}
}

module.exports = Tenso;

/*function error (server, req, res, status, err) {
	server.respond(req, res, err, status);
}*/
