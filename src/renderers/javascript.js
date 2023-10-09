export function javascript (req, res, arg) {
	req.headers.accept = "application/javascript";
	res.header("content-type", "application/javascript");

	return `${req.parsed.searchParams.get("callback") || "callback"}(${JSON.stringify(arg, null, 0)});`;
}
