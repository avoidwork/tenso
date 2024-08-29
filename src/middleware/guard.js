import {INT_401} from "../core/constants.js";

export function guard (req, res, next) {
	const login = req.server.auth.uri.login;

	if (req.parsed.pathname === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(INT_401);
	}
}
