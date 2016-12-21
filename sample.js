var jwt = require("jsonwebtoken");

require("./index.js")({
	port: 8000,
	routes: require("./test/routes.js"),
	logging: {
		level: "error",
		dtrace: true,
		stderr: true
	},
	auth: {
		local: {
			enabled: true,
			auth: function (username, password, callback) {
				if (username === "test" && password === 123) {
					callback(null, {username: username, password: password});
				} else {
					callback(true, null);
				}
			}
		},
		protect: ["/uuid"]
	},
	security: {
		csrf: false
	}
});
