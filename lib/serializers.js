"use strict";

function tenso(arg, err, status) {
	return {
		data: arg !== null ? arg : null,
		error: arg === null ? err.message || err || "Something went wrong" : null,
		links: [],
		status: status || 200
	};
}

var serializers = {
	"application/json": tenso,
	tenso: tenso
};

module.exports = serializers;
