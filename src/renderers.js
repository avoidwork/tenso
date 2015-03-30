/**
 * Renderers
 *
 * @type {Object}
 */
let renderers = {
	html: {
		fn: function ( arg, req, headers, tpl ) {
			var protocol = req.headers[ "x-forwarded-proto" ] ? req.headers[ "x-forwarded-proto" ] + ":" : req.parsed.protocol;

			return ( tpl || "" )
				.replace( "{{url}}", req.parsed.href.replace( req.parsed.protocol, protocol ) )
				.replace( "{{headers}}", Object.keys( headers ).sort( array.sort ).map( function ( i ) {
					return "<tr><td>"+ i + "</td><td>"+ sanitize( headers[ i ] ) + "</td></tr>";
				} ).join( "\n" ) )
				.replace( "{{formats}}", req.server.config.renderers.map( function ( i ) {
					return "<option value='" + i + "'>"+ i.toUpperCase() + "</option>";
				} ).join( "\n" ) )
				.replace( "{{body}}", JSON.stringify( arg, null, 2 ) )
				.replace( "{{year}}", new Date().getFullYear() )
				.replace( "{{version}}", "{{VERSION}}" );
		},
		header: "text/html"
	},
	json: {
		fn: function ( arg ) {
			return arg;
		},
		header: "application/json"
	},
	yaml: {
		fn: function ( arg ) {
			return yaml.stringify( arg, 4 );
		},
		header: "application/yaml"
	},
	xml: {
		fn: function ( arg ) {
			return xml.encode( arg );
		},
		header: "application/xml"
	}
};
