require("./lib/index")({
	logs: {
		level: "info",
		stderr: true
	},
	routes: require(__dirname + "/test/routes.js")
});
