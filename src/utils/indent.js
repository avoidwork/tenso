import {EMPTY, IDENT_VAR} from "../core/constants.js";

export function indent (arg = EMPTY, fallback = 0) {
	return arg.includes(IDENT_VAR) ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}
