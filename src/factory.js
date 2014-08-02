/**
 * Tenso factory
 *
 * @method factory
 * @return {Object} Tenso instance
 */
function factory ( config ) {
	var HOSTNAME = config.hostname || "localhost",
        vhosts   = {},
        instance;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[HOSTNAME]  = "www";
	config.root       = __dirname + "/../";
	config.routes     = require( config.root + config.routes );
	config.vhosts     = vhosts;
	config["default"] = HOSTNAME;

	instance = new Tenso();

	return bootstrap( instance, config );
}
