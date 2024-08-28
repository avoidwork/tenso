export function redirect (req, res) {
	res.redirect(req.config.auth.uri.redirect, false);
}
