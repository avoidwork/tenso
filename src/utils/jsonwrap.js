import {jsonWrap as regex} from "./regex.js"

export function jsonWrap (arg) {
	return regex.test(arg);
}
