
// @todo replace with a good library
function serialize (arg) {
	return arg;
}

export function csv (req, res, arg) {
	return serialize(arg)
}
