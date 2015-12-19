let serializers = new Map();

/** Default serializer */
function tenso (arg, err, status) {
	return {
		data: arg !== null ? arg : null,
		error: arg === null ? err.message || err || "Something went wrong" : null,
		links: [],
		status: status || 200
	};
}

serializers.set("application/json", tenso);

module.exports = serializers;
