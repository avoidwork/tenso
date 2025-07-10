import { TensoRequest, TensoResponse } from './tenso';

/**
 * Renders data as CSV format with headers and download attachment
 * Converts arrays and objects to CSV format with proper casting for different data types
 */
export declare function csv(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as HTML using template replacement
 * Replaces template placeholders with actual values including headers, body, and metadata
 */
export declare function html(req: TensoRequest, res: TensoResponse, arg: any, tpl?: string): string;

/**
 * Renders data as JSONP callback for JavaScript consumption
 * Wraps JSON data in a callback function for cross-domain requests
 */
export declare function javascript(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as JSON with configurable indentation
 * Uses server configuration and request headers to determine indentation level
 */
export declare function json(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as JSON Lines format
 * Each object is serialized as a separate line of JSON
 */
export declare function jsonl(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as plain text with recursive handling of arrays and objects
 * Arrays are joined with commas, objects are JSON stringified, primitives are converted to strings
 */
export declare function plain(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as XML format with proper formatting and entity processing
 * Handles arrays with special array node names and includes XML prolog
 */
export declare function xml(req: TensoRequest, res: TensoResponse, arg: any): string;

/**
 * Renders data as YAML format
 * Converts JavaScript objects and arrays to YAML string representation
 */
export declare function yaml(req: TensoRequest, res: TensoResponse, arg: any): string; 