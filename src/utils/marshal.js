import {EMPTY, ENCODED_SPACE, GET, IE, INT_0, ITEM, RELATED, S, SLASH} from "../core/constants.js";
import {id} from "./id.js";
import {hypermedia as hypermediaPattern, trailing, trailingS, trailingY} from "./regex.js";
import {scheme} from "./scheme.js";

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
			if (obj[i] !== void 0 && obj[i] !== null) {
				const lid = id(i);
				const isLinkable = hypermediaPattern.test(i);

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (lid || isLinkable) {
					const lkey = obj[i].toString();
					let lcollection, uri;

					if (isLinkable) {
						lcollection = i.replace(trailing, EMPTY).replace(trailingS, EMPTY).replace(trailingY, IE) + S;
						lrel = RELATED;
					} else {
						lcollection = item_collection;
						lrel = ITEM;
					}

					if (scheme(lkey) === false) {
						uri = `${lcollection[0] === SLASH ? EMPTY : SLASH}${lcollection.replace(/\s/g, ENCODED_SPACE)}/${lkey.replace(/\s/g, ENCODED_SPACE)}`;

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
