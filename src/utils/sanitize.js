import {GREATER_THAN, LESS_THAN, STRING} from "../core/constants.js";

export function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LESS_THAN).replace(/>/g, GREATER_THAN) : arg;
}
