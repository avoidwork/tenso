import {COMMA, EMPTY} from "../core/constants.js";

export function explode (arg = EMPTY, delimiter = COMMA) {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}
