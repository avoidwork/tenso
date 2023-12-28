import {OPTIONS} from "../utils/constants.js";

export function bypass (req, res, next) {
	req.unprotect = req.cors && req.method === OPTIONS || req.server.config.auth.unprotect.filter(i => i.test(req.url)).length > 0;
	next();
}
