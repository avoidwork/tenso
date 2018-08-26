"use strict";

const codes = require("http").STATUS_CODES,
	serializers = new Map();

function passthru (arg) {
	return arg;
}

function reduce (arg, err, status = 200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || codes[status] : arg;
}

serializers.set("application/javascript", passthru);
serializers.set("application/json", (arg, err, status = 200, stack = false) => {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || codes[status] : null,
		links: [],
		status: status
	};
});
serializers.set("application/yaml", passthru);
serializers.set("application/xml", passthru);
serializers.set("text/csv", reduce);
serializers.set("text/html", passthru);
serializers.set("text/plain", reduce);

module.exports = serializers;
