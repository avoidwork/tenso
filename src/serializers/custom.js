import {STATUS_CODES} from "node:http";
import {INT_200} from "../core/constants.js";

export function custom (arg, err, status = INT_200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}
