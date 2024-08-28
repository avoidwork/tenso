import lusca from "lusca";

let memoized = false,
	cachedFn, cachedKey;

export function csrfWrapper (req, res, next) {
	if (memoized === false) {
		cachedKey = req.server.security.key;
		cachedFn = lusca.csrf({key: cachedKey, secret: req.server.security.secret});
	}

	if (req.unprotect) {
		next();
	} else {
		cachedFn(req, res, err => {
			if (err === void 0 && req.csrf && cachedKey in res.locals) {
				res.header(req.server.security.key, res.locals[cachedKey]);
			}

			next(err);
		});
	}
}
