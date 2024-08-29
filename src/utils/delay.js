import {random} from "./random.js";

export function delay (fn = () => void 0, n = 0) {
	if (n === 0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}
