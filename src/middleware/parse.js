export function parse (req, res, next) {
	let valid = true,
		exception;

	if (req.body !== "") {
		const type = "content-type" in req.headers ? req.headers["content-type"].replace(/\s.*$/, "") : "";
		const parsers = req.server.parsers;

		if (type.length > 0 && parsers.has(type)) {
			try {
				req.body = parsers.get(type)(req.body);
			} catch (err) {
				valid = false;
				exception = err;
			}
		}
	}

	next(valid === false ? exception : void 0);
}
