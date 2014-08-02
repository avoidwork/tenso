var tenso  = require( "./lib/tenso" ).factory,
    routes = require( "./routes.js" ),
    app    = tenso( {routes: routes} );
