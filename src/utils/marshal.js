import {EMPTY, ENCODED_SPACE, GET, IE, INT_0, ITEM, RELATED, S, SLASH} from "../core/constants.js";
import {id} from "./id.js";
import {hypermedia as hypermediaPattern, trailing, trailingS, trailingY} from "./regex.js";

// Cache for URI transformations to avoid repeated string operations
const uriCache = new Map();

/**
 * Optimized URI encoding with caching
 * @param {string} str - String to encode
 * @returns {string} Encoded string
 */
function cachedUriEncode (str) {
	if (uriCache.has(str)) {
		return uriCache.get(str);
	}

	const encoded = str.replace(/\s/g, ENCODED_SPACE);
	uriCache.set(str, encoded);

	return encoded;
}

/**
 * Parses objects for hypermedia properties and generates links
 * Identifies ID-like and linkable properties to create hypermedia links
 * @param {Object} obj - The object to parse for hypermedia properties
 * @param {string} rel - The relationship type for links
 * @param {string} item_collection - The collection name for items
 * @param {string} root - The root URL for relative links
 * @param {Set} seen - Set of already processed URIs to avoid duplicates
 * @param {Array} links - Array to collect generated links
 * @param {Object} server - The server object for permission checking
 * @returns {Object|null} The processed object or null if empty
 */
// Parsing the object for hypermedia properties
export function marshal (obj, rel, item_collection, root, seen, links, server) {
	let keys = Object.keys(obj),
		lrel = rel || RELATED,
		result;

	if (keys.length === INT_0) {
		result = null;
	} else {
		for (const i of keys) {
			const value = obj[i];

			if (value !== void 0 && value !== null) {
				const lid = id(i);
				const isLinkable = hypermediaPattern.test(i);

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (lid || isLinkable) {
					const lkey = value.toString();
					let lcollection, uri;

					if (lid) {
						lcollection = item_collection;
						lrel = ITEM;
					} else if (isLinkable) {
						// Cache the collection transformation
						const cacheKey = `collection_${i}`;
						if (uriCache.has(cacheKey)) {
							lcollection = uriCache.get(cacheKey);
						} else {
							lcollection = i.replace(trailing, EMPTY).replace(trailingS, EMPTY).replace(trailingY, IE) + S;
							uriCache.set(cacheKey, lcollection);
						}
						lrel = RELATED;
					}

					// Check if it's not already an absolute URI
					if (!lkey.includes("://")) {
						if (lid) {
							// For ID-like keys, use collection + value
							const encodedCollection = cachedUriEncode(lcollection);
							const encodedKey = cachedUriEncode(lkey);
							uri = `${lcollection[0] === SLASH ? EMPTY : SLASH}${encodedCollection}/${encodedKey}`;
						} else {
							// For URL/URI keys, use value directly (it already contains the collection)
							const encodedKey = cachedUriEncode(lkey);
							uri = `${lkey[0] === SLASH ? EMPTY : SLASH}${encodedKey}`;
						}

						if (uri !== root && seen.has(uri) === false) {
							seen.add(uri);

							if (server.allowed(GET, uri)) {
								links.push({uri: uri, rel: lrel});
							}
						}
					}
				}
			}
		}

		result = obj;
	}

	return result;
}
