import {explode} from "./explode.js";

export function capitalize (obj, e = false, delimiter = " ") {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(0).toUpperCase() + obj.slice(1);
}
