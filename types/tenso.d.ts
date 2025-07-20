import { Server } from 'http';
import { Woodland, MiddlewareFunction as WoodlandMiddlewareFunction, ErrorMiddlewareFunction as WoodlandErrorMiddlewareFunction } from 'woodland';
import {
  TensoConfig,
  TensoRequest,
  TensoResponse,
  MiddlewareFunction,
  ErrorMiddlewareFunction,
  RouteHandler,
  ParserFunction,
  RendererFunction,
  SerializerFunction
} from './core.js';

/**
 * Rate limiting state object
 */
export interface RateLimitState {
  /** Current rate limit */
  limit: number;
  /** Remaining requests */
  remaining: number;
  /** Reset timestamp */
  reset: number;
  /** Time to reset in seconds */
  time_reset: number;
}

/**
 * Rate limiting result tuple
 */
export type RateLimitResult = [valid: boolean, limit: number, remaining: number, reset: number];

/**
 * The main Tenso web framework class that extends Woodland
 * @class Tenso
 * @extends {Woodland}
 */
export declare class Tenso extends Woodland {
  /** Map of parsers for different media types */
  parsers: Map<string, ParserFunction>;

  /** Map of rate limiting states by request ID */
  rates: Map<string, RateLimitState>;

  /** Map of renderers for different media types */
  renderers: Map<string, RendererFunction>;

  /** Map of serializers for different media types */
  serializers: Map<string, SerializerFunction>;

  /** HTTP/HTTPS server instance */
  server: Server | null;

  /** Framework version */
  version: string;

  /**
   * Creates an instance of Tenso
   * @param config - Configuration object for the Tenso instance
   */
  constructor(config?: Partial<TensoConfig>);

  /**
   * Checks if a given HTTP method can modify data
   * @param method - HTTP method to check
   * @returns True if the method can modify data, false otherwise
   */
  canModify(method: string): boolean;

  /**
   * Handles connection setup for incoming requests
   * @param req - Request object
   * @param res - Response object
   */
  override connect(req: TensoRequest, res: TensoResponse): void;

  /**
   * Creates an EventSource instance
   * @param args - Arguments to pass to the eventsource function
   * @returns Result of the eventsource function
   */
  eventsource(...args: any[]): any;

  /**
   * Final processing step in the request pipeline
   * @param req - Request object
   * @param res - Response object
   * @param data - Data to be processed
   * @returns The processed data
   */
  final(req: TensoRequest, res: TensoResponse, data: any): any;

  /**
   * Handles response headers, particularly caching headers
   * @param req - Request object
   * @param res - Response object
   */
  headers(req: TensoRequest, res: TensoResponse): void;

  /**
   * Initializes the Tenso server with middleware, routes, and configuration
   * @returns The Tenso instance for method chaining
   */
  init(): this;

  /**
   * Registers a parser for a specific media type
   * @param mediatype - The media type to register the parser for
   * @param fn - The parser function
   * @returns The Tenso instance for method chaining
   */
  parser(mediatype?: string, fn?: ParserFunction): this;

  /**
   * Handles rate limiting for incoming requests
   * @param req - Request object
   * @param fn - Optional function to modify rate limit state
   * @returns Array containing [valid, limit, remaining, reset]
   */
  rateLimit(req: TensoRequest, fn?: (req: TensoRequest, state: RateLimitState) => RateLimitState): RateLimitResult;

  /**
   * Renders the response based on the accepted content type
   * @param req - Request object
   * @param res - Response object
   * @param data - Data to be rendered
   * @returns The rendered response
   */
  render(req: TensoRequest, res: TensoResponse, data: any): any;

  /**
   * Registers a renderer for a specific media type
   * @param mediatype - The media type to register the renderer for
   * @param fn - The renderer function
   * @returns The Tenso instance for method chaining
   */
  renderer(mediatype: string, fn: RendererFunction): this;

  /**
   * Registers a serializer for a specific media type
   * @param mediatype - The media type to register the serializer for
   * @param fn - The serializer function
   * @returns The Tenso instance for method chaining
   */
  serializer(mediatype: string, fn: SerializerFunction): this;

  /**
   * Sets up signal handlers for graceful server shutdown
   * @returns The Tenso instance for method chaining
   */
  signals(): this;

  /**
   * Starts the HTTP or HTTPS server
   * @returns The Tenso instance for method chaining
   */
  start(): this;

  /**
   * Stops the server
   * @returns The Tenso instance for method chaining
   */
  stop(): this;

  // Override Woodland methods to use Tenso-specific types
  /**
   * Override Woodland's decorate method with Tenso-specific implementation
   */
  decorate(req: TensoRequest, res: TensoResponse): void;

  /**
   * Override Woodland's route method with Tenso-specific implementation
   */
  route(req: TensoRequest, res: TensoResponse): void;
}

/**
 * Factory function that creates and initializes a Tenso server instance
 * @param userConfig - User configuration object to override defaults
 * @returns An initialized Tenso server instance
 */
export declare function tenso(userConfig?: Partial<TensoConfig>): Tenso;
