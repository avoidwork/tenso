var uuid  = require( "keigai" ).util.uuid;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, new Error( "TPS Cover Sheet not attached" ), 785 );
	},
	"/uuid": function ( req, res ) {
		this.respond( req, res, uuid() );
	}
}
