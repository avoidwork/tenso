import { TensoRequest, TensoResponse, MiddlewareFunction } from './core.js';

/**
 * Prometheus metrics configuration for middleware
 */
export interface PrometheusMiddlewareConfig {
  /** Include HTTP method in metrics */
  includeMethod?: boolean;
  /** Include request path in metrics */
  includePath?: boolean;
  /** Include status code in metrics */
  includeStatusCode?: boolean;
  /** Include default metrics */
  includeUp?: boolean;
  /** Histogram buckets for request duration */
  buckets?: number[];
  /** Custom labels to add to metrics */
  customLabels?: Record<string, string>;
}

/**
 * Prometheus middleware function with register property
 */
export interface PrometheusMiddleware extends MiddlewareFunction {
  /** Prometheus metrics registry */
  register: {
    /** Content type for metrics endpoint */
    contentType: string;
    /** Get metrics as a promise */
    metrics(): Promise<string>;
  };
}

/**
 * Middleware that sets async protection flag
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function asyncFlag(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware that allows bypassing certain request processing
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function bypass(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for CSRF protection
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function csrf(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware that terminates the request if the URL matches configured exit patterns
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function exit(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for request guarding and validation
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function guard(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for parsing request bodies
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function parse(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for handling request payload
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function payload(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Creates Prometheus metrics middleware
 * @param config - Prometheus configuration
 * @returns Prometheus middleware function with metrics registry
 */
export declare function prometheus(config: PrometheusMiddlewareConfig): PrometheusMiddleware;

/**
 * Middleware for rate limiting
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function rate(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for handling redirects
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function redirect(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void;

/**
 * Middleware for API gateway functionality (Zuul)
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 * @param next - The next middleware function
 */
export declare function zuul(req: TensoRequest, res: TensoResponse, next: (err?: any) => void): void; 