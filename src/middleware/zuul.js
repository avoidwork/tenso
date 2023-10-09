import {rate} from "./rate.js";

export function zuul (req, res, next) {
	const uri = req.parsed.pathname;
	let protectd = false;

	if (req.unprotect === false) {
		for (const i of req.server.config.auth.protect) {
			if (i.test(uri)) {
				protectd = true;
				break;
			}
		}
	}

	// Setting state so the connection can be terminated properly
	req.protect = protectd;
	req.protectAsync = false;

	rate(req, res, e => {
		if (e !== void 0) {
			res.error(e);
		} else if (protectd) {
			next();
		} else {
			keymaster(req, res);
		}
	});
}
