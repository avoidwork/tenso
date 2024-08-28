import {OPTIONS} from "../core/constants.js";

export function bypass (req, res, next) {
	req.unprotect = req.cors && req.method === OPTIONS || req.server.auth.unprotect.some(i => i.test(req.url));
	next();
}
