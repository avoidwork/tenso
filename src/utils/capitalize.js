import {explode} from "./explode.js";
import {INT_0, INT_1, SPACE} from "../core/constants.js";

export function capitalize (obj, e = false, delimiter = SPACE) {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(INT_0).toUpperCase() + obj.slice(INT_1);
}
