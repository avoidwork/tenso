let sanitize = ( arg ) => {
	let output = arg;
	let invalid = [["<", "&lt;"], [">", "&gt;"]];

	array.iterate( invalid, function ( i ) {
		output = output.replace( new RegExp( i[ 0 ], "g" ), i[ 1 ] );
	} );

	return output;
};
