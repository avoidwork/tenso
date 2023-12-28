import {EMPTY} from "../utils/constants.js";

export function json (arg = EMPTY) {
	return JSON.parse(arg);
}
