let sanitize = ( arg ) => {
	let output = arg;

	if ( typeof arg === "string" ) {
		array.iterate( [["<", "&lt;"], [">", "&gt;"]], function ( i ) {
			output = output.replace( new RegExp( i[ 0 ], "g" ), i[ 1 ] );
		} );
	}

	return output;
};
