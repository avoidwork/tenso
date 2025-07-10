import { TensoRequest, TensoResponse, ParserFunction, RendererFunction, SerializerFunction } from './core.js';

/**
 * Handles authentication logic for the Tenso server
 * Sets up authentication middleware and routes
 * @param server - The Tenso server instance
 */
export declare function auth(server: any): void;

/**
 * Capitalizes the first letter of a string
 * @param input - The string to capitalize
 * @returns The capitalized string
 */
export declare function capitalize(input: string): string;

/**
 * Splits data into chunks of specified size
 * @param data - The data to chunk
 * @param size - The chunk size
 * @returns Array of chunks
 */
export declare function chunk<T>(data: T[], size: number): T[][];

/**
 * Creates a deep clone of an object
 * @param obj - The object to clone
 * @returns Deep copy of the object
 */
export declare function clone<T>(obj: T): T;

/**
 * Creates a delay/timeout
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export declare function delay(ms: number): Promise<void>;

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, etc.)
 * @param value - The value to check
 * @returns True if the value is considered empty
 */
export declare function empty(value: any): boolean;

/**
 * Splits a string into an array based on delimiters
 * @param input - The string to explode
 * @param delimiter - The delimiter to split on
 * @returns Array of string parts
 */
export declare function explode(input: string, delimiter?: string): string[];

/**
 * Checks if an HTTP method typically has a request body
 * @param method - The HTTP method to check
 * @returns True if the method typically has a body
 */
export declare function hasBody(method: string): boolean;

/**
 * Checks if a request has been read/processed
 * @param req - The request object to check
 * @returns True if the request has been read
 */
export declare function hasRead(req: TensoRequest): boolean;

/**
 * Adds hypermedia/HATEOAS links to response data
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The response data to enhance with hypermedia
 * @returns Enhanced data with hypermedia links
 */
export declare function hypermedia(req: TensoRequest, res: TensoResponse, data: any): any;

/**
 * Generates a unique identifier
 * @param prefix - Optional prefix for the ID
 * @returns Unique identifier string
 */
export declare function id(prefix?: string): string;

/**
 * Determines the appropriate indentation level for formatted output
 * @param accept - Accept header value
 * @param defaultIndent - Default indentation level
 * @returns Indentation level
 */
export declare function indent(accept: string, defaultIndent: number): number;

/**
 * Checks if a value is empty using strict criteria
 * @param value - The value to check
 * @returns True if the value is empty
 */
export declare function isEmpty(value: any): boolean;

/**
 * Marshals data for transmission
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to marshal
 * @returns Marshaled data
 */
export declare function marshal(req: TensoRequest, res: TensoResponse, data: any): any;

/**
 * Map of content types to their corresponding parser functions
 */
export declare const parsers: Map<string, ParserFunction>;

/**
 * Generates a random value
 * @param max - Maximum value (exclusive)
 * @param min - Minimum value (inclusive)
 * @returns Random number
 */
export declare function random(max?: number, min?: number): number;

/**
 * Regular expressions used throughout the framework
 */
export declare const regex: {
  /** MIME type regex */
  mimetype: RegExp;
  /** Other common patterns */
  [key: string]: RegExp;
};

/**
 * Map of content types to their corresponding renderer functions
 */
export declare const renderers: Map<string, RendererFunction>;

/**
 * Sanitizes input data for safe processing
 * @param input - The input to sanitize
 * @returns Sanitized input
 */
export declare function sanitize(input: string): string;

/**
 * Determines the URL scheme (http/https) based on request
 * @param req - The HTTP request object
 * @returns URL scheme string
 */
export declare function scheme(req: TensoRequest): string;

/**
 * Serializes data for response
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to serialize
 * @returns Serialized data
 */
export declare function serialize(req: TensoRequest, res: TensoResponse, data: any): any;

/**
 * Map of content types to their corresponding serializer functions
 */
export declare const serializers: Map<string, SerializerFunction>;

/**
 * Sorts an array or object based on specified criteria
 * @param data - The data to sort
 * @param sortBy - The field or criteria to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted data
 */
export declare function sort<T>(data: T[], sortBy?: string | ((item: T) => any), direction?: 'asc' | 'desc'): T[]; 