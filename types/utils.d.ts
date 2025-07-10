import { TensoRequest, TensoResponse, Tenso } from './tenso';

/**
 * Authentication setup function that configures auth middleware for a Tenso instance
 */
export declare function auth(obj: Tenso): Tenso;

/**
 * Capitalizes the first letter of a string or each word in a delimited string
 */
export declare function capitalize(obj: string, e?: boolean, delimiter?: string): string;

/**
 * Splits an array into chunks of specified size
 */
export declare function chunk<T>(arg?: T[], size?: number): T[][];

/**
 * Deep clones an object using JSON serialization/deserialization
 */
export declare const clone: <T>(arg: T) => T;

/**
 * Executes a function after a random delay or immediately if no delay is specified
 */
export declare function delay(fn?: () => void, n?: number): void;

/**
 * Checks if an object with a length or size property is empty
 */
export declare function empty(obj: { length?: number; size?: number }): boolean;

/**
 * Splits a string by delimiter and trims whitespace around each piece
 */
export declare function explode(arg?: string, delimiter?: string): string[];

/**
 * Checks if an HTTP method typically has a request body
 */
export declare function hasBody(arg: string): boolean;

/**
 * Checks if an HTTP method is a read-only operation
 */
export declare function hasRead(arg: string): boolean;

/**
 * Hypermedia link interface
 */
export interface HypermediaLink {
  uri: string;
  rel: string;
}

/**
 * Processes hypermedia links for responses including pagination and resource links
 * Handles collection pagination, resource linking, and hypermedia header generation
 */
export declare function hypermedia(req: TensoRequest, res: TensoResponse, rep: any): any;

/**
 * Checks if a string matches common ID patterns
 */
export declare function id(arg?: string): boolean;

/**
 * Extracts indentation value from a string or returns fallback
 * Looks for "indent=number" pattern in the input string
 */
export declare function indent(arg?: string, fallback?: number): number;

/**
 * Checks if a value is an empty string
 */
export declare function isEmpty(arg?: any): boolean;

/**
 * Parses objects for hypermedia properties and generates links
 * Identifies ID-like and linkable properties to create hypermedia links
 */
export declare function marshal(
  obj: any,
  rel: string,
  item_collection: string,
  root: string,
  seen: Set<string>,
  links: HypermediaLink[],
  server: Tenso
): any | null;

/**
 * Map of content types to their corresponding parser functions
 * Maps MIME types to functions that can parse request bodies of that type
 */
export declare const parsers: Map<string, (body: string) => any>;

/**
 * Generates a random integer between 1 and n (inclusive)
 */
export declare function random(n?: number): number;

/**
 * Regular expression patterns used throughout the framework
 */
export declare const bodySplit: RegExp;
export declare const collection: RegExp;
export declare const hypermedia: RegExp;
export declare const mimetype: RegExp;
export declare const trailing: RegExp;
export declare const trailingS: RegExp;
export declare const trailingSlash: RegExp;
export declare const trailingY: RegExp;

/**
 * Map of content types to their corresponding renderer functions
 * Maps MIME types to functions that can render data in that format
 */
export declare const renderers: Map<string, (req: TensoRequest, res: TensoResponse, data: any, template?: string) => string>;

/**
 * Sanitizes HTML by escaping < and > characters
 */
export declare function sanitize(arg: any): any;

/**
 * Checks if a string contains a URI scheme indicator
 */
export declare function scheme(arg?: string): boolean;

/**
 * Serializes response data based on content type negotiation
 * Handles format selection, sorting, and error serialization
 */
export declare function serialize(req: TensoRequest, res: TensoResponse, arg: any): any;

/**
 * Map of content types to their corresponding serializer functions
 * Maps MIME types to functions that can serialize data for that format
 */
export declare const serializers: Map<string, (data: any, error: Error | string | null, status?: number, stack?: boolean) => any>;

/**
 * Sorts an array based on query parameters in the request
 * Supports ordering by object keys and reverse ordering
 */
export declare function sort<T>(arg: T, req: TensoRequest): T; 