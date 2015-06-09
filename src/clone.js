/**
 * Shallow clones an Object
 *
 * @method clone
 * @param {Mixed} arg To be cloned
 * @returns {Mixed}   Clone of `arg`
 */
function clone ( arg ) {
	return JSON.parse( JSON.stringify( arg ) );
}
