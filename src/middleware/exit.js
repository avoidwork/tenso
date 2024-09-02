export function exit (req, res, next) {
	if (req.server.exit.includes(req.url)) {
		req.exit();
	} else {
		next();
	}
}
