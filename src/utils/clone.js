/**
 * Deep clones an object using JSON serialization/deserialization
 * @param {*} arg - The object to clone
 * @returns {*} A deep clone of the input object
 */
export const clone = arg => JSON.parse(JSON.stringify(arg));
