var random   = require( "keigai" ).util.number.random,
    response = require( "./lib/tenso" ).response;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, response( new Error( "TPS Cover Sheet not attached" ), 785 ), 785 );
	},
	"/random": function ( req, res ) {
		this.respond( req, res, response( random() ) );
	}
}
