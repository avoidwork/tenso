import {indent} from "../utils/indent.js";

export function json (req, res, arg) {
	return JSON.stringify(arg, null, indent(req.headers.accept, req.server.json));
}
