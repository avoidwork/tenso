import {EMPTY, HEADER_CONTENT_TYPE, INT_0} from "../core/constants.js";

export function parse (req, res, next) {
	let valid = true,
		exception;

	if (req.body !== EMPTY) {
		const type = req.headers?.[HEADER_CONTENT_TYPE]?.replace(/\s.*$/, EMPTY) ?? EMPTY;
		const parsers = req.server.parsers;

		if (type.length > INT_0 && parsers.has(type)) {
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
