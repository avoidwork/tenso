var uuid = require("tiny-uuid4");

module.exports.get = {
	"/": [
		"empty",
		"items",
		"somethings",
		"test",
		"things",
		"users",
		"uuid"
	],
	"/empty": [],
	"/items(\/?)": [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		12,
		13,
		14,
		15
	],
	"/test": "Get to the chopper!",
	"/test/:hidden": function (req, res) {
		res.send(req.params.hidden);
	},
	"/things": [
		{
			id: 1,
			name: "thing 1",
			user_id: 1,
			welcome: "<h1>blahblah</h1>"
		}, {
			id: 2,
			name: "thing 2",
			user_id: 1
		}, {
			id: 3,
			name: "thing 3",
			user_id: 2
		}
	],
	"/somethings": [
		"abc",
		"def"
	],
	"/somethings/abc": {
		"_id": "abc",
		"user_id": 123,
		"title": "This is a title",
		"body": "Where is my body?",
		"source_url": "http://source.tld"
	},
	"/somethings/def": {
		"_id": "def",
		"user_id": 123,
		"source_url": "http://source.tld"
	},
	"/users": [
		123
	],
	"/users/123": {
		"_id": 123,
		firstName: "Jason",
		lastName: "Mulligan"
	},
	"/uuid": function (req, res) {
		this.respond(req, res, uuid());
	}
};

module.exports.post = {
	"/test": function (req, res) {
		this.respond(req, res, "OK!");
	}
};

module.exports.socket = {
	connection: function (socket, server) {
		console.log("[Connection]");
		server.send(socket, new Buffer("a text message"), false);
		server.send(socket, new Buffer("a binary message"), true);
		server.setUserData(socket, "persistent per socket data");
	},
	message: function (socket, message, binary, server) {
		console.log("[Message: " + message + "]");
		server.send(socket, new Buffer("You sent me this: \"" + message + "\""), false);
	},
	close: function () {
		console.log("[Closed connection]");
	}
};

module.exports.coap = {
	request: function (req, res) {
		res.end("Hello World!");
	}
};
