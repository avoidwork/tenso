import {randomInt} from "node:crypto";

export function random (n = 1e2) {
	return randomInt(1, n);
}
