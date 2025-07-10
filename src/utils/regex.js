/**
 * Regular expression for splitting request body parameters on & and = characters
 * @type {RegExp}
 */
export const bodySplit = /&|=/;

/**
 * Regular expression for matching collection patterns in URLs
 * @type {RegExp}
 */
export const collection = /(.*)(\/.*)$/;

/**
 * Regular expression for matching hypermedia-related field names (id, url, uri patterns)
 * @type {RegExp}
 */
export const hypermedia = /(([a-z]+(_)?)?id|url|uri)$/i;

/**
 * Regular expression for matching MIME type parameters (semicolon and beyond)
 * @type {RegExp}
 */
export const mimetype = /;.*/;

/**
 * Regular expression for matching trailing underscore patterns
 * @type {RegExp}
 */
export const trailing = /_.*$/;

/**
 * Regular expression for matching trailing 's' character
 * @type {RegExp}
 */
export const trailingS = /s$/;

/**
 * Regular expression for matching trailing slash character
 * @type {RegExp}
 */
export const trailingSlash = /\/$/;

/**
 * Regular expression for matching trailing 'y' character
 * @type {RegExp}
 */
export const trailingY = /y$/;
