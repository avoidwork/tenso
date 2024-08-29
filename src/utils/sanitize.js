import {GT, LT, STRING} from "../core/constants.js";

export function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LT).replace(/>/g, GT) : arg;
}
