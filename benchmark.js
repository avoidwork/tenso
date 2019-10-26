require("./index.js")({
	port: 8000,
	routes: {
		get: {
			"/": "Hello world!"
		}
	},
	logging: {
		enabled: false
	},
	security: {
		csrf: false
	},
	dtrace: false,
	etags: {
		enabled: false
	}
});
