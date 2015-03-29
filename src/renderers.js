/**
 * Renderers
 *
 * @type {Object}
 */
let renderers = {
	html: {
		fn: function ( arg ) {
			return arg;
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
