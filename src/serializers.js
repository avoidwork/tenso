import {STATUS_CODES} from "node:http";

export const serializers = new Map();

function custom (arg, err, status = 200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}

function reduce (arg, err, status = 200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}

serializers.set("application/javascript", custom);
serializers.set("application/json", custom);
serializers.set("application/yaml", custom);
serializers.set("application/xml", custom);
serializers.set("text/csv", custom);
serializers.set("text/html", custom);
serializers.set("text/plain", reduce);
