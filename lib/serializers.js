"use strict";

const codes = require("http").STATUS_CODES,
	serializers = new Map();

serializers.set("application/json", (arg, err, status = 200, stack = false) => {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || codes[status] : null,
		links: [],
		status: status
	};
});

module.exports = serializers;
