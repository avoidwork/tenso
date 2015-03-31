/**
 * Decorates the `rep` with hypermedia links
 *
 * Arrays of results are automatically paginated, Objects
 * will be parsed and have keys 'lifted' into the 'link'
 * Array if a pattern is matched, e.g. "user_(guid|uuid|id|uri|url)"
 * will map to "/users/$1"
 *
 * @method hypermedia
 * @param  {Object} server  TurtleIO instance
 * @param  {Object} req     Client request
 * @param  {Object} rep     Serialized representation
 * @param  {Object} headers HTTP response headers
 * @return {Object}         HTTP response body
 */
let hypermedia = ( server, req, rep, headers ) => {
	let seen = {},
		protocol = req.headers[ "x-forwarded-proto" ] ? req.headers[ "x-forwarded-proto" ] + ":" : req.parsed.protocol,
		query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	let parse = ( obj, rel, item_collection ) => {
		rel = rel || "related";
		let keys = array.keys( obj );

		if ( keys.length === 0 ) {
			obj = null;
		} else {
			array.iterate( keys, ( i ) => {
				let collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if ( REGEX.id.test( i ) || REGEX.hypermedia.test( i ) ) {
					if ( !REGEX.id.test( i ) ) {
						collection = i.replace( REGEX.trailing, "" ).replace( REGEX.trailing_s, "" ).replace( REGEX.trailing_y, "ie" ) + "s";
						rel = "related";
					} else {
						collection = item_collection;
						rel = "item";
					}

					uri = REGEX.scheme.test( obj[ i ] ) ? ( obj[ i ].indexOf( "//" ) > -1 ? obj[ i ] : protocol + "//" + req.parsed.host + obj[ i ] ) : ( protocol + "//" + req.parsed.host + "/" + collection + "/" + obj[ i ] );

					if ( uri !== root && !seen[ uri ] ) {
						rep.data.link.push( { uri: uri, rel: rel } );
						seen[ uri ] = 1;
					}
				}
			} );
		}

		return obj;
	}

	if ( rep.status >= 200 && rep.status <= 206 ) {
		query = req.parsed.query;
		page = query.page || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		rep.data = { link: [], result: rep.data };
		root = protocol + "//" + req.parsed.host + req.parsed.pathname;

		if ( req.parsed.pathname !== "/" ) {
			rep.data.link.push( {
				uri: root.replace( REGEX.trailing_slash, "" ).replace( REGEX.collection, "$1" ),
				rel: "collection"
			} );
		}

		if ( rep.data.result instanceof Array ) {
			if ( isNaN( page ) || page <= 0 ) {
				page = 1;
			}

			nth = Math.ceil( rep.data.result.length / page_size );

			if ( nth > 1 ) {
				rep.data.result = array.limit( rep.data.result, ( page - 1 ) * page_size, page_size );
				query.page = 0;
				query.page_size = page_size;

				root += "?" + array.keys( query ).map( ( i ) => {
					return i + "=" + encodeURIComponent( query[ i ] );
				} ).join( "&" );

				if ( page > 1 ) {
					rep.data.link.push( { uri: root.replace( "page=0", "page=1" ), rel: "first" } );
				}

				if ( page - 1 > 1 && page <= nth ) {
					rep.data.link.push( { uri: root.replace( "page=0", "page=" + ( page - 1 ) ), rel: "prev" } );
				}

				if ( page + 1 < nth ) {
					rep.data.link.push( { uri: root.replace( "page=0", "page=" + ( page + 1 ) ), rel: "next" } );
				}

				if ( nth > 0 && page !== nth ) {
					rep.data.link.push( { uri: root.replace( "page=0", "page=" + nth ), rel: "last" } );
				}
			} else {
				root += "?" + array.keys( query ).map( ( i ) => {
					return i + "=" + encodeURIComponent( query[ i ] );
				} ).join( "&" );
			}

			array.iterate( rep.data.result, ( i ) => {
				let uri;

				if ( typeof i === "string" && REGEX.scheme.test( i ) ) {
					uri = i.indexOf( "//" ) > -1 ? i : protocol + "//" + req.parsed.host + i;

					if ( uri !== root ) {
						rep.data.link.push( { uri: uri, rel: "item" } );
					}
				}

				if ( i instanceof Object ) {
					parse( i, "item", req.parsed.pathname.replace( REGEX.trailing_slash, "" ).replace( REGEX.leading, "" ) );
				}
			} );
		}
		else if ( rep.data.result instanceof Object ) {
			parent = req.parsed.pathname.split( "/" ).filter( ( i ) => {
				return i !== "";
			} );

			if ( parent.length > 1 ) {
				parent.pop();
			}

			rep.data.result = parse( rep.data.result, undefined, array.last( parent ) );
		}

		if ( rep.data.link !== undefined && rep.data.link.length > 0 ) {
			headers.link = array.keySort( rep.data.link, "rel, uri" ).map( ( i ) => {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			} ).join( ", " );
		}
	}

	return rep;
};
