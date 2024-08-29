import {EMPTY, SLASH, URI_SCHEME} from "../core/constants.js";

export function scheme (arg = EMPTY) {
	return arg.includes(SLASH) || arg[0] === URI_SCHEME;
}
