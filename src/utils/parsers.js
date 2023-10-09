import {json} from "../parsers/json.js";
import {xWwwFormURLEncoded} from "../parsers/xWwwFormURLEncoded.js";

export const parsers = new Map([
	[
		"application/x-www-form-urlencoded",
		xWwwFormURLEncoded
	],
	[
		"application/json",
		json
	]
]);
