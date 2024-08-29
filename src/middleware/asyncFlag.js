export function asyncFlag (req, res, next) {
	req.protectAsync = true;
	next();
}
