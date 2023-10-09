import {STATUS_CODES} from "http";

export function plain (arg, err, status = 200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}
