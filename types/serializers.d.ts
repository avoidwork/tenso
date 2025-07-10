import { TensoRequest, TensoResponse, SerializerFunction } from './core.js';

/**
 * Custom serializer that handles complex data types and transformations
 * Provides advanced serialization logic for various data formats
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to serialize
 * @returns The serialized data
 */
export declare function custom(req: TensoRequest, res: TensoResponse, data: any): any;

/**
 * Plain serializer that performs minimal transformation
 * Passes data through with basic string conversion if needed
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param data - The data to serialize
 * @returns The serialized data (typically unchanged)
 */
export declare function plain(req: TensoRequest, res: TensoResponse, data: any): any;

/**
 * Map of content types to their corresponding serializer functions
 * Maps MIME types to functions that can serialize data for that format
 */
export declare const serializers: Map<string, SerializerFunction>; 