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
 * @return {Undefined}      undefined
 */
function hypermedia ( server, req, rep, headers ) {
	var seen = {},
		protocol = req.headers[ "x-forwarded-proto" ] ? req.headers[ "x-forwarded-proto" ] + ":" : req.parsed.protocol,
		query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function parse ( obj, rel, item_collection ) {
		rel = rel || "related";
		var keys = array.keys( obj );

		if ( keys.length === 0 ) {
			obj = null;
		}
		else {
			array.each( keys, function ( i ) {
				var collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if ( regex.id.test( i ) || regex.hypermedia.test( i ) ) {
					if ( !regex.id.test( i ) ) {
						collection = i.replace( regex.trailing, "" ).replace( regex.trailing_s, "" ).replace( regex.trailing_y, "ie" ) + "s";
						rel = "related";
					}
					else {
						collection = item_collection;
						rel = "item";
					}

					uri = regex.scheme.test( obj[ i ] ) ? ( obj[ i ].indexOf( "//" ) > -1 ? obj[ i ] : protocol + "//" + req.parsed.host + obj[ i ] ) : ( protocol + "//" + req.parsed.host + "/" + collection + "/" + obj[ i ] );

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
				uri: root.replace( regex.trailing_slash, "" ).replace( regex.collection, "$1" ),
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

				root += "?" + array.keys( query ).map( function ( i ) {
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
			}
			else {
				root += "?" + array.keys( query ).map( function ( i ) {
					return i + "=" + encodeURIComponent( query[ i ] );
				} ).join( "&" );
			}

			array.each( rep.data.result, function ( i ) {
				var uri;

				if ( typeof i == "string" && regex.scheme.test( i ) ) {
					uri = i.indexOf( "//" ) > -1 ? i : protocol + "//" + req.parsed.host + i;

					if ( uri !== root ) {
						rep.data.link.push( { uri: uri, rel: "item" } );
					}
				}

				if ( i instanceof Object ) {
					parse( i, "item", req.parsed.pathname.replace( regex.trailing_slash, "" ).replace( regex.leading, "" ) );
				}
			} );
		}
		else if ( rep.data.result instanceof Object ) {
			parent = req.parsed.pathname.split( "/" ).filter( function ( i ) {
				return i !== "";
			} );

			if ( parent.length > 1 ) {
				parent.pop();
			}

			rep.data.result = parse( rep.data.result, undefined, array.last( parent ) );
		}

		if ( rep.data.link !== undefined && rep.data.link.length > 0 ) {
			headers.link = array.keySort( rep.data.link, "rel, uri" ).map( function ( i ) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			} ).join( ", " );
		}
	}

	return rep;
}
