import { TensoRequest, TensoResponse, RendererFunction } from './core.js';

/**
 * Renders data as CSV format
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as CSV
 * @param template - Optional template string
 * @returns The CSV formatted string
 */
export declare function csv(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as HTML with optional template
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as HTML
 * @param template - Optional HTML template string
 * @returns The HTML formatted string
 */
export declare function html(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as JavaScript code (JSONP)
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as JavaScript
 * @param template - Optional template string
 * @returns The JavaScript formatted string
 */
export declare function javascript(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as JSON with configurable indentation
 * Uses server configuration and request headers to determine indentation level
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as JSON
 * @param template - Optional template string
 * @returns The JSON formatted string
 */
export declare function json(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as JSON Lines (JSONL) format
 * Each object is rendered as a separate line of JSON
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as JSONL
 * @param template - Optional template string
 * @returns The JSONL formatted string
 */
export declare function jsonl(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as plain text
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as plain text
 * @param template - Optional template string
 * @returns The plain text string
 */
export declare function plain(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as XML format
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as XML
 * @param template - Optional template string
 * @returns The XML formatted string
 */
export declare function xml(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Renders data as YAML format
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to render as YAML
 * @param template - Optional template string
 * @returns The YAML formatted string
 */
export declare function yaml(req: TensoRequest, res: TensoResponse, data: any, template?: string): string;

/**
 * Map of content types to their corresponding renderer functions
 * Maps MIME types to functions that can render data in that format
 */
export declare const renderers: Map<string, RendererFunction>; 