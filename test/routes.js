import {randomUUID as uuid} from "node:crypto";

export const get = {
	"/": [
		"empty",
		"items",
		"somethings",
		"test",
		"things",
		"users",
		"uuid"
	],
	"/null": null,
	"/empty": [],
	"/items(/?)": [
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
	"/stream": (req, res) => req.server.eventsource("initialized").init(req, res).send("Hello World!", "welcome"),
	"/users": [
		123
	],
	"/users/123": {
		"_id": 123,
		firstName: "Jason",
		lastName: "Mulligan"
	},
	"/uuid": function (req, res) {
		res.send(uuid(), 200, {"cache-control": "no-cache, must-revalidate"});
	}
};

export const post = {
	"/test": function (req, res) {
		res.send("OK!");
	}
};

export const routes = {get, post};
export default routes;
