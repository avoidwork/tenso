/**
 * Decorates the `rep` with hypermedia links
 *
 * @method hypermedia
 * @param  {Object} server  TurtleIO instance
 * @param  {Object} req     Client request
 * @param  {Object} rep     Serialized representation
 * @param  {Object} headers HTTP response headers
 * @return {Undefined}      undefined
 */
function hypermedia ( server, req, rep, headers ) {
	var query     = req.parsed.query,
	    page      = query.page      || 1,
	    page_size = query.page_size || server.config.pageSize || 5,
	    nth, uri;

	if ( rep.status >= 200 && rep.status <= 206 ) {
		rep.data = {result: rep.data};

		if ( rep.data.result instanceof Array ) {
			if ( isNaN( page ) || page <= 0 ) {
				page = 1;
			}

			nth             = Math.ceil( rep.data.result.length / page_size );
			rep.data.result = array.limit( rep.data.result, ( page - 1 ) * page_size, page_size );
			rep.data.link   = [];
			uri             = req.parsed.protocol + "//" + req.parsed.host + req.parsed.pathname;
			query.page      = 0;
			query.page_size = page_size;

			uri += "?" + array.keys( query ).map( function ( i ) {
				return i + "=" + query[i];
			} ).join ( "&" );

			if ( page > 1 ) {
				rep.data.link.push( {uri: uri.replace( "page=0", "page=1" ), rel: "first"} );
			}

			if ( page - 1 > 0 ) {
				rep.data.link.push( {uri: uri.replace( "page=0", "page=" + ( page - 1 ) ), rel: "prev"} );
			}

			if ( page + 1 < nth ) {
				rep.data.link.push( {uri: uri.replace( "page=0", "page=" + ( page + 1 ) ), rel: "next"} );
			}

			if ( page < nth ) {
				rep.data.link.push( {uri: uri.replace("page=0", "page=" + nth ), rel: "last"} );
			}
		}

		if ( rep.data.link !== undefined ) {
			headers.link = rep.data.link.map( function ( i ) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			} ).join( ", " );
		}
	}

	return rep;
}
