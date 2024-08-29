import {randomInt} from "node:crypto";
import {INT_1, INT_100} from "../core/constants.js";

export function random (n = INT_100) {
	return randomInt(INT_1, n);
}
