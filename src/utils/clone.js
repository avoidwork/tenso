/**
 * Deep clones an object using efficient recursive copying
 * Handles circular references, various data types, and maintains performance
 * Maintains compatibility with JSON-based cloning by filtering functions and undefined values
 * @param {*} obj - The object to clone
 * @param {WeakMap} [seen] - Internal map to handle circular references
 * @returns {*} A deep clone of the input object
 */
export function clone (obj, seen = new WeakMap()) {
	// Handle primitive types and null
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	// Handle circular references
	if (seen.has(obj)) {
		return seen.get(obj);
	}

	// Handle Date objects
	if (obj instanceof Date) {
		return new Date(obj.getTime());
	}

	// Handle RegExp objects
	if (obj instanceof RegExp) {
		return new RegExp(obj.source, obj.flags);
	}

	// Handle Arrays
	if (Array.isArray(obj)) {
		const cloned = [];
		seen.set(obj, cloned);

		for (let i = 0; i < obj.length; i++) {
			const value = obj[i];
			// Skip functions and undefined values like JSON.stringify does
			if (typeof value !== "function" && value !== undefined) {
				cloned[i] = clone(value, seen);
			} else if (value === undefined) {
				// JSON.stringify converts undefined array elements to null
				cloned[i] = null;
			} else if (typeof value === "function") {
				// Functions in arrays are converted to null by JSON.stringify
				cloned[i] = null;
			}
		}

		return cloned;
	}

	// Handle Map objects
	if (obj instanceof Map) {
		const cloned = new Map();
		seen.set(obj, cloned);

		for (const [key, value] of obj) {
			// Skip functions and undefined values
			if (typeof value !== "function" && value !== undefined) {
				cloned.set(clone(key, seen), clone(value, seen));
			}
		}

		return cloned;
	}

	// Handle Set objects
	if (obj instanceof Set) {
		const cloned = new Set();
		seen.set(obj, cloned);

		for (const value of obj) {
			// Skip functions and undefined values
			if (typeof value !== "function" && value !== undefined) {
				cloned.add(clone(value, seen));
			}
		}

		return cloned;
	}

	// Handle plain objects
	if (Object.prototype.toString.call(obj) === "[object Object]") {
		const cloned = {};
		seen.set(obj, cloned);

		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const value = obj[key];
				// Skip functions and undefined values like JSON.stringify does
				if (typeof value !== "function" && value !== undefined) {
					cloned[key] = clone(value, seen);
				}
			}
		}

		return cloned;
	}

	// For other object types (like functions, custom classes), return as-is
	// This maintains compatibility with the original JSON-based approach
	// which would also not clone these properly
	return obj;
}
