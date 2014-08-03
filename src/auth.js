/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} config   Tenso configuration
 * @param  {String} hostname Server hostname
 * @return {Object}          Updated Tenso configuration
 */
function auth ( config, hostname ) {
	var obj;

	if ( config.auth.type === "basic" ) {
		obj = {};
		obj[hostname] = {
			authRealm: config.auth.realm || "Private",
			authList: config.auth.list
		};

		config.auth = obj;
	}
	else if ( config.auth.type === "local" ) {
		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = passport.authenticate( "local", {successRedirect: "/", failureRedirect: "/login"} );
	}

	return config;
}
