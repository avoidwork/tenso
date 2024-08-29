export function redirect (req, res) {
	res.redirect(req.server.auth.uri.redirect, false);
}
