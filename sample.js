require("./index.js")({
	logging: {
		level: "debug"
	},
	websocket: {
		enabled: true,
		options: {
			port: 3000
		}
	},
	coap: {
		enabled: true
	},
	routes: require(__dirname + "/test/routes.js")
});
