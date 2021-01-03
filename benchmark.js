"use strict";

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
		csrf: false,
		xssProtection: false,
		nosniff: false
	}
});
