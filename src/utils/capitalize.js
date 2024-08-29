import {explode} from "./explode.js";
import {SPACE} from "../core/constants.js";

export function capitalize (obj, e = false, delimiter = SPACE) {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(0).toUpperCase() + obj.slice(1);
}
