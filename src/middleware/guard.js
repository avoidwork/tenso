import {INT_401} from "../core/constants.js";

export function guard (req, res, next) {
	const login = req.server.auth.uri.login;

	if (req.url === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(INT_401);
	}
}
