require("./lib/index")({
	logging: {
		level: "debug"
	},
	websocket: {
		enabled: true,
		port: 3000
	},
	routes: require(__dirname + "/test/routes.js")
});
