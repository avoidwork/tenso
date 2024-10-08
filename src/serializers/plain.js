import {STATUS_CODES} from "node:http";
import {INT_200} from "../core/constants.js";

export function plain (arg, err, status = INT_200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}
