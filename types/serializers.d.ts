/**
 * Custom serializer that creates a structured response object with metadata
 * Returns an object containing data, error, links, and status fields
 * @param arg - The data to serialize
 * @param err - The error object or message, null if no error
 * @param status - HTTP status code
 * @param stack - Whether to include error stack trace
 * @returns Structured response object with data, error, links, and status
 */
export declare function custom(
  arg: any,
  err: Error | string | null,
  status?: number,
  stack?: boolean
): {
  data: any;
  error: string | null;
  links: any[];
  status: number;
};

/**
 * Plain serializer that returns data directly or error information
 * Returns the original data if no error, otherwise returns error message or stack trace
 * @param arg - The data to serialize
 * @param err - The error object or message, null if no error
 * @param status - HTTP status code (used for fallback error message)
 * @param stack - Whether to return error stack trace instead of message
 * @returns The original data or error information
 */
export declare function plain(
  arg: any,
  err: Error | string | null,
  status?: number,
  stack?: boolean
): any; 