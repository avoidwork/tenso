"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require("path"),
    http = require("http"),
    array = require("retsu"),
    turtleio = require("turtle.io"),
    deferred = require("tiny-defer"),
    merge = require("tiny-merge"),
    regex = require(path.join(__dirname, "regex")),
    utility = require(path.join(__dirname, "utility"));

var renderers = require(path.join(__dirname, "renderers")),
    serializers = require(path.join(__dirname, "serializers"));

var Tenso = function () {
	function Tenso(config) {
		var _this = this;

		_classCallCheck(this, Tenso);

		this.hostname = "";
		this.rates = {};
		this.server = turtleio(config, function (req, res, status, arg) {
			_this.error(req, res, status, arg);
		});
		this.server.tenso = this;
		this.version = "3.2.0";
	}

	_createClass(Tenso, [{
		key: "error",
		value: function error(req, res) {
			var status = arguments.length <= 2 || arguments[2] === undefined ? 500 : arguments[2];
			var arg = arguments[3];

			var msg = arg || http.STATUS_CODES[status];

			return this.respond(req, res, msg instanceof Error ? msg : new Error(msg), status);
		}
	}, {
		key: "rate",
		value: function rate(req, fn) {
			var config = this.server.config.rate,
			    id = req.sessionID || req.ip,
			    valid = true,
			    seconds = parseInt(new Date().getTime() / 1000, 10),
			    limit = undefined,
			    remaining = undefined,
			    reset = undefined,
			    state = undefined;

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
	}, {
		key: "redirect",
		value: function redirect(req, res, uri) {
			var perm = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

			return this.server.send(req, res, "", !perm ? 302 : 301, { location: uri });
		}
	}, {
		key: "render",
		value: function render(req, arg, headers) {
			var format = "application/json",
			    accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			    renderer = undefined;

			array.each(accepts, function (i) {
				var mimetype = i.replace(regex.mimetype, ""),
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
	}, {
		key: "renderer",
		value: function renderer(mimetype, fn) {
			renderers.set(mimetype, fn);

			return this;
		}
	}, {
		key: "respond",
		value: function respond(req, res, arg, status, headers) {
			var resStatus = status || 200,
			    defer = deferred(),
			    ref = undefined,
			    output = undefined;

			if (!res._header) {
				ref = [headers || {}];

				if (res._headers) {
					merge(ref[0], res._headers);
				}

				// Decorating early for renderers
				if (ref[0].allow === undefined) {
					ref[0].allow = req.allow;
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

				output = this.render(req, utility.hypermedia(this.server, req, this.serialize(req, arg, resStatus), ref[0]), ref[0]);
				ref[0] = this.server.headers(req, res, resStatus, output, ref[0], false);
				this.server.send(req, res, output, resStatus, ref[0]).then(defer.resolve, defer.reject);
			} else {
				defer.resolve();
			}

			return defer.promise;
		}
	}, {
		key: "serialize",
		value: function serialize(req, arg) {
			var status = arguments.length <= 2 || arguments[2] === undefined ? 200 : arguments[2];

			var format = "application/json",
			    accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			    errz = arg instanceof Error,
			    result = undefined,
			    serializer = undefined;

			array.each(accepts, function (i) {
				var mimetype = i.replace(regex.mimetype, ""),
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
	}, {
		key: "serializer",
		value: function serializer(mimetype, fn) {
			serializers.set(mimetype, fn);

			return this;
		}
	}]);

	return Tenso;
}();

module.exports = function (config) {
	return new Tenso(config);
};
