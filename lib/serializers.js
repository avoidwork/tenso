"use strict";

const http = require("http"),
	serializers = new Map();

/** Default serializer */
function tenso (arg, err, status = 200) {
	return {
		data: arg !== null ? arg : null,
		error: arg === null ? err.message || err || http.STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}

serializers.set("application/json", tenso);

module.exports = serializers;
