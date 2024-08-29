import {EMPTY, I, ID, ID_2} from "../core/constants.js";

const pattern = new RegExp(`${ID}|${ID_2}$`, I);

export function id (arg = EMPTY) {
	return pattern.test(arg);
}
