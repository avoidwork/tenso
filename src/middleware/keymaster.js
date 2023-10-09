export function keymaster (req, res) {
	if (req.protect === false || req.protectAsync === false || (req.session !== void 0 && req.isAuthenticated())) { // eslint-disable-line no-extra-parens
		req.last(req, res);
	} else {
		res.error(401);
	}
}
