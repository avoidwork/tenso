var uuid = require("keigai" ).util.uuid;

module.exports.get = {
	"/": ["/items", "/things"],
	"/empty": [],
	"/items(\/?)": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
	"/test": "Get to the chopper!",
	"/things": [{id: 1, name: "thing 1", user_id: 1}, {id: 2, name: "thing 2", user_id: 1}, {id: 3, name: "thing 3", user_id: 2}],
	"/uuid": function (req, res) {
		this.respond( req, res, uuid() );
	},
	"/somethings/abc": {"_id": "abc", "user_id": 123, "title": "This is a title", "body": "Where is my body?", "source_url": "http://source.tld"},
	"/somethings/def": {"_id": "def", "user_id": 123, "source_url": "http://source.tld"},
	"/users": [123],
	"/users/123": {"_id":123, firstName: "Jason", lastName: "Mulligan"}
}

module.exports.post = {
	"/test": function ( req, res ) {
		this.respond( req, res, "OK!" );
	}
}