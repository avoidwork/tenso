require("./index.js")({
	port: 8443,
	routes: require("./test/routes.js"),
	http2: true,
	logging: {
		level: "info"
	},
	auth: {
		local: {
			enabled: false,
			auth: function (username, password, callback) {
				if (username === "test" && password === 123) {
					callback(null, {username: username, password: password});
				} else {
					callback(true, null);
				}
			}
		},
		jwt: {
			enabled: false,
			auth: function (token, cb) {
				cb(null, token);
			},
			secretOrKey: "jennifer"
		}
	},
	security: {
		csrf: false
	},
	ssl: {
		key: "./ssl/localhost.key",
		cert: "./ssl/localhost.crt"
	}
});
