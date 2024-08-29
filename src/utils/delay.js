import {random} from "./random.js";
import {INT_0} from "../core/constants.js";

export function delay (fn = () => void 0, n = INT_0) {
	if (n === INT_0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}
