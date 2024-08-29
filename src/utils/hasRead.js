import {GET, HEAD, OPTIONS} from "../core/constants.js";

export function hasRead (arg) {
	return arg.includes(GET) || arg.includes(HEAD) || arg.includes(OPTIONS);
}
