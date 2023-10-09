import {custom} from "../serializers/custom.js";
import {plain} from "../serializers/plain.js";

export const serializers = new Map([
	["application/json", custom],
	["application/yaml", custom],
	["application/xml", custom],
	["text/plain", plain],
	["application/javascript", custom],
	["text/csv", custom],
	["text/html", custom]
]);
