import {PATCH, POST, PUT} from "../core/constants.js";

export function hasBody (arg) {
	return arg.includes(PATCH) || arg.includes(POST) || arg.includes(PUT);
}
