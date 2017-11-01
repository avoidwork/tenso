"use strict";

const http = require("http"),
	serializers = new Map();

// Default serializer
function tenso (arg, err, status = 200, stack = false) {
	return {
		data: arg !== null ? arg : null,
		error: arg === null ? (stack ? err.stack : err.message) || err || http.STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}

serializers.set("application/json", tenso);

module.exports = serializers;
