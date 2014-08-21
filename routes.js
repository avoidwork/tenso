var uuid = require( "keigai" ).util.uuid;
 
module.exports.get = {
    "/": ["/reports", "/uuid"],
    "/reports": ["/reports/tps"],
    "/reports/tps": function ( req, res ) {
        res.error( 785, new Error( "TPS Cover Sheet not attached" ) );
    },
    "/uuid": function ( req, res ) {
        res.respond( uuid(), 200, {"cache-control": "no-cache"} );
    }
}