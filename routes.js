var random  = require( "keigai" ).util.number.random,
    prepare = require( "./lib/tenso" ).prepare;

module.exports.get = {
	"/": [],
	"/reports/tps": "TPS Cover Sheet not attached",
	"/random": function ( req, res ) {
		this.respond( req, res, prepare( random() ) );
	}
}
