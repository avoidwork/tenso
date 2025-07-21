import {XMLBuilder} from "fast-xml-parser";
import {XML_ARRAY_NODE_NAME, XML_PROLOG} from "../core/constants.js";

// Memoization cache for XML transformations
const transformCache = new WeakMap();

/**
 * Renders data as XML format with proper formatting and entity processing
 * Handles arrays with special array node names and includes XML prolog
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as XML
 * @returns {string} The XML formatted string with prolog
 */
export function xml (req, res, arg) {
	const builder = new XMLBuilder({
		processEntities: true,
		format: true,
		ignoreAttributes: false,
		arrayNodeName: Array.isArray(arg) ? XML_ARRAY_NODE_NAME : undefined
	});

	// Transform property names for XML compatibility with memoization
	const transformForXml = obj => {
		// Handle primitive types directly
		if (obj === null || obj === undefined || typeof obj !== "object") {
			return obj;
		}

		// Check cache for objects we've already transformed to prevent circular references
		if (transformCache.has(obj)) {
			return "[Circular Reference]";
		}

		let result;

		if (Array.isArray(obj)) {
			// Set cache first to prevent infinite recursion
			transformCache.set(obj, "[Processing]");
			result = obj.map(transformForXml);
		} else if (obj instanceof Date) {
			result = obj.toISOString();
		} else if (typeof obj === "object") {
			// Set cache first to prevent infinite recursion
			transformCache.set(obj, "[Processing]");
			const transformed = {};

			for (const [key, value] of Object.entries(obj)) {
				// Transform property names: name -> n, etc.
				const xmlKey = key === "name" ? "n" : key;
				transformed[xmlKey] = transformForXml(value);
			}

			result = transformed;
		} else {
			result = obj;
		}

		// Cache the result for objects (but not primitives)
		if (obj && typeof obj === "object") {
			transformCache.set(obj, result);
		}

		return result;
	};

	// Handle different data types appropriately
	let data;

	if (Array.isArray(arg)) {
		if (arg.length === 0) {
			// Empty array should produce empty <o></o>
			data = {};
		} else {
			// For arrays, create structure that will produce individual elements
			data = transformForXml(arg);
		}
	} else {
		data = transformForXml(arg);
	}

	return `${XML_PROLOG}\n${builder.build({o: data})}`;
}

