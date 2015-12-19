let serializers = new Map();

function register (name, arg) {
	serializers.set(name, arg);
}

/** Default serializer */
function tenso (arg, err, status) {
	return {
		data: arg !== null ? arg : null,
		error: arg === null ? err.message || err || "Something went wrong" : null,
		links: [],
		status: status || 200
	};
}

register("application/json", tenso);
register("tenso", tenso);

module.exports = {
	register: register,
	types: serializers
};
