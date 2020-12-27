"use strict";

const {STATUS_CODES} = require("http"),
	serializers = new Map([
		[
			"text/plain",
			function reduce (arg, err, status = 200, stack = false) {
				return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
			}
		],
		[
			"*/*",
			function custom (arg, err, status = 200, stack = false) {
				return {
					data: arg,
					error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
					links: [],
					status: status
				};
			}
		]
	]);

module.exports = serializers;
