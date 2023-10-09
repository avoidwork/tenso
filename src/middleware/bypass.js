export function bypass (req, res, next) {
	req.unprotect = (req.cors && req.method === "OPTIONS") || req.server.config.auth.unprotect.filter(i => i.test(req.url)).length > 0; // eslint-disable-line no-extra-parens
	next();
}
