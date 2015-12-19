require("./lib/index")({
	logs: {
		level: "error",
		stderr: true
	},
	auth: {
		local: {
			enabled: true,
			auth: function (username, password, callback) {
				if (username === "test" && password === 123) {
					callback(null, {username: username, password: password});
				}
				else {
					callback(true, null);
				}
			}
		},
		protect: ["/uuid"]
	},
	routes: require(__dirname + "/routes.js")
});
