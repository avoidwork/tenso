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
			enabled: true,
			auth: function (username, password, callback) {
				console.log(username, password, callback);
				callback(null, {username: "x", password: "y"});
			},
			secretOrKey: "jennifer"
		},
		protect: ["/uuid"]
	}
});

console.log('Token', jwt.sign({username: 'jason@attack.io' }, 'jennifer'));
