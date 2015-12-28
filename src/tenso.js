const path = require("path"),
	array = require("retsu"),
	turtleio = require("turtle.io"),
	deferred = require("tiny-defer"),
	merge = require("tiny-merge"),
	regex = require(path.join(__dirname, "regex")),
	utility = require(path.join(__dirname, "utility"));

let renderers = require(path.join(__dirname, "renderers")),
	serializers = require(path.join(__dirname, "serializers"));

class Tenso {
	constructor (config) {
		this.hostname = "";
		this.messages = {};
		this.rates = {};
		this.server = turtleio(config);
		this.server.tenso = this;
		this.version = "{{VERSION}}";
	}

	error (req, res, status, arg) {
		return this.server.error(req, res, status, arg);
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
			reset = state.reset = seconds + config.reset;
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
		return this.server.respond(req, res, this.server.messages.NO_CONTENT, this.server.codes[!perm ? "FOUND" : "MOVED"], {location: uri});
	}

	render (req, arg, headers) {
		let format = "application/json",
			accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			renderer;

		array.each(accepts, function (i) {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (renderers.has(mimetype)) {
				found = true;
				format = mimetype;
			}

			if (found) {
				return false;
			}
		});

		renderer = renderers.get(format);
		headers["content-type"] = format;

		return renderer(arg, req, headers, format === "text/html" ? this.server.config.template : undefined);
	}

	renderer (mimetype, fn) {
		renderers.set(mimetype, fn);

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
					ref[0]["cache-control"] = utility.clone(this.server.config.headers["cache-control"]);
				}

				if (ref[0]["cache-control"] !== undefined && ref[0]["cache-control"].indexOf("private ") === -1) {
					ref[0]["cache-control"] = "private " + ref[0]["cache-control"];
				}
			}

			if (!regex.modify.test(req.method) && regex.modify.test(req.allow) && this.server.config.security.csrf && res.locals[this.server.config.security.key]) {
				ref[0][this.server.config.security.key] = res.locals[this.server.config.security.key];
			}

			ref[0] = this.server.headers(req, ref[0], resStatus);
			this.server.respond(req, res, this.render(req, utility.hypermedia(this.server, req, this.serialize(req, arg, resStatus), ref[0]), ref[0]), resStatus, ref[0]).then(function () {
				defer.resolve();
			}, defer.reject);
		} else {
			defer.resolve();
		}

		return defer.promise;
	}

	serialize (req, arg, status = 200) {
		let format = "application/json",
			accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			errz = arg instanceof Error,
			result, serializer;

		array.each(accepts, function (i) {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (serializers.has(mimetype)) {
				found = true;
				format = mimetype;
			}

			if (found) {
				return false;
			}
		});

		serializer = serializers.get(format);

		if (errz) {
			result = serializer(null, arg, status < 400 ? 500 : status);
		} else {
			result = serializer(arg, null, status);
		}

		return result;
	}

	serializer (mimetype, fn) {
		serializers.set(mimetype, fn);

		return this;
	}
}

module.exports = function (config) {
	return new Tenso(config);
};
