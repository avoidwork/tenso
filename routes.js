var random  = require( "keigai" ).util.number.random,
    prepare = require( "./lib/tenso" ).prepare;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, prepare( null, "TPS Cover Sheet not attached", 785 ), 785 );
	},
	"/random": function ( req, res ) {
		this.respond( req, res, prepare( random() ) );
	}
}
