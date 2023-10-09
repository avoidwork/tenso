export function guard (req, res, next) {
	const login = req.server.config.auth.uri.login;

	if (req.parsed.pathname === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(401);
	}
}
