/**
 * Parses JSON string into JavaScript object
 * @param arg - The JSON string to parse
 * @returns The parsed JavaScript object or value
 * @throws SyntaxError when the JSON string is invalid
 */
export declare function json(arg?: string): any;

/**
 * Parses JSON Lines (JSONL) string into JavaScript array
 * Each line should contain a valid JSON object
 * @param arg - The JSONL string to parse
 * @returns Array of parsed JavaScript objects
 * @throws Error when any line contains invalid JSON
 */
export declare function jsonl(arg?: string): any[];

/**
 * Parses URL-encoded form data into JavaScript object
 * Decodes URL-encoded strings and converts values to appropriate types
 * @param arg - The URL-encoded form data string to parse
 * @returns Object containing the parsed form data with decoded keys and coerced values
 */
export declare function xWwwFormURLEncoded(arg: string): Record<string, any>; 