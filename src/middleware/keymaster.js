export function keymaster (req, res) {
	if (req.protect === false || req.protectAsync === false || req.session !== void 0 && req.isAuthenticated()) {
		req.last(req, res);
	} else {
		res.error(401);
	}
}
