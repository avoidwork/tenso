/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
function factory ( arg ) {
	var HOSTNAME = arg ? arg.hostname || "localhost" : "localhost",
        vhosts   = {},
        config   = arg ? merge( clone( CONFIG, true ), arg ) : CONFIG,
        instance;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[HOSTNAME]  = "www";
	config.root       = __dirname + "/../";
	config.vhosts     = vhosts;
	config["default"] = HOSTNAME;

	if ( config.auth !== null ) {
		config = auth( config, HOSTNAME );
	}

	instance = new Tenso();

	return bootstrap( instance, config );
}
