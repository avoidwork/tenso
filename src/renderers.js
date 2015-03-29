/**
 * Renderers
 *
 * @type {Object}
 */
let renderers = {
	html: {
		fn: function ( arg, req, headers, tpl ) {
			return ( tpl || "" )
				.replace( "{{url}}", req.parsed.href )
				.replace( "{{headers}}", Object.keys( headers ).map( function ( i ) {
					return "<tr><td>"+ i + "</td><td>"+ sanitize( headers[ i ] ) + "</td></tr>";
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
