/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
let factory = ( arg ) => {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		vhosts = {},
		config = arg ? merge( clone( CONFIG, true ), arg ) : CONFIG,
		obj;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[ hostname ] = "www";
	config.root = __dirname + "/../";
	config.vhosts = vhosts;
	config[ "default" ] = hostname;

	obj = new Tenso();
	obj.hostname = hostname;

	return bootstrap( obj, config );
};
