var uuid = require("keigai" ).util.uuid;

module.exports.get = {
	"/": ["/items"],
	"/empty": [],
	"/items": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
	"/uuid": function (req, res) {
		this.respond( req, res, uuid() );
	},
	"/something": {"user_id": 123, "title": "This is a title", "body": "Where is my body?", "source_url": "http://source.tld"}
}
