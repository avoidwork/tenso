import {EMPTY} from "../core/constants.js";

export function json (arg = EMPTY) {
	return JSON.parse(arg);
}
