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
	var query, page, page_size, nth, root, keys;

	if ( rep.status >= 200 && rep.status <= 206 ) {
		query     = req.parsed.query;
		page      = query.page      || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		rep.data  = {link: [], result: rep.data};
		root      = req.parsed.protocol + "//" + req.parsed.host + req.parsed.pathname;

		if ( rep.data.result instanceof Array ) {
			if ( isNaN( page ) || page <= 0 ) {
				page = 1;
			}

			nth             = Math.ceil( rep.data.result.length / page_size );
			rep.data.result = array.limit( rep.data.result, ( page - 1 ) * page_size, page_size );
			query.page      = 0;
			query.page_size = page_size;

			root += "?" + array.keys( query ).map( function ( i ) {
				return i + "=" + encodeURIComponent( query[i] );
			} ).join ( "&" );

			if ( page > 1 ) {
				rep.data.link.push( {uri: root.replace( "page=0", "page=1" ), rel: "first"} );
			}

			if ( page - 1 > 1 && page <= nth ) {
				rep.data.link.push( {uri: root.replace( "page=0", "page=" + ( page - 1 ) ), rel: "prev"} );
			}

			if ( page + 1 < nth ) {
				rep.data.link.push( {uri: root.replace( "page=0", "page=" + ( page + 1 ) ), rel: "next"} );
			}

			if ( nth > 0 && page !== nth ) {
				rep.data.link.push( {uri: root.replace("page=0", "page=" + nth ), rel: "last"} );
			}
		}
		else if ( rep.data.result instanceof Object ) {
			keys = array.keys( rep.data.result );

			rep.data.link.push( {uri: root.replace( REGEX_COLLECTION, "$1" ), rel: "collection"} );

			if ( keys.length === 0 ) {
				rep.data.result = null;
			}
			else {
				array.each( keys, function ( i ) {
					var collection, uri;

					// If ID like keys are found, and are not URIs, they are assumed to be root collections
					if ( REGEX_HYPERMEDIA.test( i ) ) {
						collection = i.replace( REGEX_TRAILING, "" ).replace( REGEX_TRAILING_S, "" ) + "s";
						uri = REGEX_SCHEME.test( rep.data.result[i] ) ? ( rep.data.result[i].indexOf( "//" ) > -1 ? rep.data.result[i] : req.parsed.protocol + "//" + req.parsed.host + rep.data.result[i] ) : ( req.parsed.protocol + "//" + req.parsed.host + "/" + collection + "/" + rep.data.result[i] );

						if ( uri !== root ) {
							rep.data.link.push( {uri: uri, rel: "related"} );
							delete rep.data.result[i];
						}
					}
				} );
			}
		}

		if ( rep.data.link !== undefined && rep.data.link.length > 0 ) {
			headers.link = rep.data.link.map( function ( i ) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			} ).join( ", " );
		}
	}

	return rep;
}
