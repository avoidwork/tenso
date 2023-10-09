export function payload (req, res, next) {
	if (hasBody(req.method) && (req.headers["content-type"] || "").includes("multipart") === false) {
		const obj = req,
			max = req.server.config.maxBytes;
		let body = "",
			invalid = false;

		obj.setEncoding("utf8");

		obj.on("data", data => {
			if (invalid === false) {
				body += data;

				if (max > 0 && Buffer.byteLength(body) > max) {
					invalid = true;
					res.error(413);
				}
			}
		});

		obj.on("end", () => {
			if (invalid === false) {
				req.body = body;
				next();
			}
		});
	} else {
		next();
	}
}
