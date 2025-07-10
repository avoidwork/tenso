import {parse} from "tiny-jsonl";
import {EMPTY} from "../core/constants.js";

/**
 * Parses JSON Lines (JSONL) string into JavaScript array
 * Each line should contain a valid JSON object
 * @param {string} [arg=EMPTY] - The JSONL string to parse
 * @returns {Array} Array of parsed JavaScript objects
 * @throws {Error} When any line contains invalid JSON
 */
export function jsonl (arg = EMPTY) {
	return parse(arg);
}
