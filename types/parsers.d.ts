import { ParserFunction } from './core.js';

/**
 * Parses JSON string into JavaScript object
 * @param data - The JSON string to parse
 * @returns The parsed JavaScript object or value
 * @throws SyntaxError when the JSON string is invalid
 */
export declare function json(data?: string): any;

/**
 * Parses JSON Lines (JSONL) string into array of JavaScript objects
 * Each line should contain a valid JSON object
 * @param data - The JSONL string to parse
 * @returns Array of parsed JavaScript objects
 * @throws SyntaxError when any line contains invalid JSON
 */
export declare function jsonl(data?: string): any[];

/**
 * Parses URL-encoded form data into JavaScript object
 * Handles application/x-www-form-urlencoded content type
 * @param data - The URL-encoded string to parse
 * @returns Parsed JavaScript object with form data
 */
export declare function xWwwFormURLEncoded(data?: string): Record<string, any>;

/**
 * Map of content types to their corresponding parser functions
 * Maps MIME types to functions that can parse request bodies of that type
 */
export declare const parsers: Map<string, ParserFunction>; 