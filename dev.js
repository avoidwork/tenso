const path = require("path"),
	turtleio = require("turtle.io")({
		default: "localhost",
		root: path.join(__dirname, "www"),
		headers: {
			"cache-control": "no-cache"
		},
		logging: {
			level: "debug"
		},
		hosts: {
			localhost: "./"
		}
	});

turtleio.get("/assets/*", turtleio.static);

turtleio.start();