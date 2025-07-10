import { TensoRequest, TensoResponse, MiddlewareFunction } from './tenso';

/**
 * Middleware that sets the async protection flag on the request object
 */
export declare function asyncFlag(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Middleware that determines if request should bypass protection based on CORS/OPTIONS or auth patterns
 */
export declare function bypass(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * CSRF protection middleware wrapper using csrf-csrf
 * Memoizes the CSRF function for performance and handles unprotected requests
 */
export declare function csrfWrapper(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Middleware that terminates the request if the URL matches configured exit patterns
 */
export declare function exit(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Authentication guard middleware that protects routes requiring authentication
 * Allows access to login URL or for authenticated users, otherwise returns 401
 */
export declare function guard(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Request body parsing middleware that uses registered parsers based on content type
 * Attempts to parse the request body and handles parsing errors
 */
export declare function parse(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Request payload collection middleware that handles request body data
 * Collects request body data for non-multipart requests and enforces size limits
 */
export declare function payload(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Prometheus metrics configuration interface
 */
export interface PrometheusMetricsConfig {
  includeMethod: boolean;
  includePath: boolean;
  includeStatusCode: boolean;
  includeUp: boolean;
  buckets: number[];
  customLabels: Record<string, any>;
}

/**
 * Prometheus metrics middleware
 * Creates histogram and counter metrics for HTTP requests
 */
export declare function prometheus(config: PrometheusMetricsConfig): MiddlewareFunction & {
  register: {
    contentType: string;
    metrics(): Promise<string>;
  };
};

/**
 * Rate limiting middleware that enforces request rate limits
 * Tracks request rates and returns 429 status when limits are exceeded
 */
export declare function rate(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void;

/**
 * Authentication redirect middleware that redirects to the configured auth redirect URI
 */
export declare function redirect(req: TensoRequest, res: TensoResponse): void;

/**
 * Main protection middleware that coordinates authentication and rate limiting
 * Determines if a request should be protected based on auth patterns and handles rate limiting
 */
export declare function zuul(req: TensoRequest, res: TensoResponse, next: (error?: any) => void): void; 