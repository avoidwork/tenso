import {indent} from "../utils/indent.js";
import {COMMA} from "../core/constants.js";

export function plain (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => text(req, res, i)).join(COMMA) : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.json)) : arg.toString()
}
