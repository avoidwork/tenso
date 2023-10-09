import {indent} from "../utils/indent.js";

export function plan (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => text(req, res, i)).join(",") : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json)) : arg.toString()
}
