import {EMPTY, IDENT_VAR, INT_0, INT_1, INT_10} from "../core/constants.js";

export function indent (arg = EMPTY, fallback = INT_0) {
	return arg.includes(IDENT_VAR) ? parseInt(arg.match(/indent=(\d+)/)[INT_1], INT_10) : fallback;
}
