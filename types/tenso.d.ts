import { IncomingMessage, ServerResponse, Server } from 'http';
import { Server as HttpsServer } from 'https';
import { Woodland } from 'woodland';

/**
 * Authentication configuration for different authentication methods
 */
export interface AuthConfig {
  delay: number;
  protect: string[];
  unprotect: string[];
  basic: {
    enabled: boolean;
    list: string[];
  };
  bearer: {
    enabled: boolean;
    tokens: string[];
  };
  jwt: {
    enabled: boolean;
    auth: any | null;
    audience: string;
    algorithms: string[];
    ignoreExpiration: boolean;
    issuer: string;
    scheme: string;
    secretOrKey: string;
  };
  msg: {
    login: string;
  };
  oauth2: {
    enabled: boolean;
    auth: any | null;
    auth_url: string;
    token_url: string;
    client_id: string;
    client_secret: string;
  };
  uri: {
    login: string;
    logout: string;
    redirect: string;
    root: string;
  };
  saml: {
    enabled: boolean;
    auth: any | null;
  };
}

/**
 * Prometheus metrics configuration
 */
export interface PrometheusConfig {
  enabled: boolean;
  metrics: {
    includeMethod: boolean;
    includePath: boolean;
    includeStatusCode: boolean;
    includeUp: boolean;
    buckets: number[];
    customLabels: Record<string, any>;
  };
}

/**
 * Rate limiting configuration
 */
export interface RateConfig {
  enabled: boolean;
  limit: number;
  message: string;
  override: any | null;
  reset: number;
  status: number;
}

/**
 * Security configuration for CSRF, CSP, and other security features
 */
export interface SecurityConfig {
  key: string;
  secret: string;
  csrf: boolean;
  csp: string | null;
  xframe: string;
  p3p: string;
  hsts: string | null;
  xssProtection: boolean;
  nosniff: boolean;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  cookie: {
    httpOnly: boolean;
    path: string;
    sameSite: boolean;
    secure: string;
  };
  name: string;
  proxy: boolean;
  redis: {
    host: string;
    port: number;
  };
  rolling: boolean;
  resave: boolean;
  saveUninitialized: boolean;
  secret: string;
  store: string;
}

/**
 * SSL/TLS configuration
 */
export interface SslConfig {
  cert: string | null;
  key: string | null;
  pfx: string | null;
}

/**
 * Web root configuration for static files and templates
 */
export interface WebrootConfig {
  root: string;
  static: string;
  template: string;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  format: string;
  level: string;
  stack: boolean;
}

/**
 * Hypermedia/HATEOAS configuration
 */
export interface HypermediaConfig {
  enabled: boolean;
  header: boolean;
}

/**
 * Complete Tenso configuration object
 */
export interface TensoConfig {
  auth: AuthConfig;
  autoindex: boolean;
  cacheSize: number;
  cacheTTL: number;
  catchAll: boolean;
  charset: string;
  corsExpose: string;
  defaultHeaders: Record<string, string>;
  digit: number;
  etags: boolean;
  exit: string[];
  host: string;
  hypermedia: HypermediaConfig;
  index: any[];
  initRoutes: Record<string, any>;
  jsonIndent: number;
  logging: LoggingConfig;
  maxBytes: number;
  mimeType: string;
  origins: string[];
  pageSize: number;
  port: number;
  prometheus: PrometheusConfig;
  rate: RateConfig;
  renderHeaders: boolean;
  time: boolean;
  security: SecurityConfig;
  session: SessionConfig;
  silent: boolean;
  ssl: SslConfig;
  webroot: WebrootConfig;
  title?: string;
  version?: string;
}

/**
 * Extended request object with Tenso-specific properties
 */
export interface TensoRequest extends IncomingMessage {
  body?: any;
  cors?: boolean;
  csrf?: boolean;
  exit?: () => void;
  headers: Record<string, string | string[]>;
  hypermedia?: boolean;
  hypermediaHeader?: boolean;
  ip?: string;
  isAuthenticated?: () => boolean;
  method: string;
  parsed?: {
    pathname: string;
    protocol: string;
    href: string;
    search: string;
    searchParams: URLSearchParams;
  };
  private?: boolean;
  protect?: boolean;
  protectAsync?: boolean;
  server?: Tenso;
  sessionID?: string;
  unprotect?: boolean;
  url: string;
  valid?: boolean;
  allow?: string;
  session?: any;
  route?: string;
}

/**
 * Extended response object with Tenso-specific methods
 */
export interface TensoResponse extends ServerResponse {
  error: (status: number, message?: string) => void;
  header: (key: string, value: string) => void;
  json: (data: any) => void;
  redirect: (url: string, permanent?: boolean) => void;
  removeHeader: (key: string) => void;
}

/**
 * Parser function type
 */
export type ParserFunction = (body: string) => any;

/**
 * Renderer function type
 */
export type RendererFunction = (req: TensoRequest, res: TensoResponse, data: any, template?: string) => string;

/**
 * Serializer function type
 */
export type SerializerFunction = (data: any, error: Error | string | null, status?: number, stack?: boolean) => any;

/**
 * Middleware function type
 */
export type MiddlewareFunction = (req: TensoRequest, res: TensoResponse, next: (error?: any) => void) => void;

/**
 * Route handler function type
 */
export type RouteHandler = (req: TensoRequest, res: TensoResponse) => void | any;

/**
 * Rate limit state
 */
export interface RateLimitState {
  limit: number;
  remaining: number;
  reset: number;
  time_reset: number;
}

/**
 * Rate limit result tuple
 */
export type RateLimitResult = [boolean, number, number, number];

/**
 * Main Tenso web framework class that extends Woodland
 */
export declare class Tenso extends Woodland {
  auth: AuthConfig;
  cors: boolean;
  corsExpose: string;
  defaultHeaders: Record<string, string>;
  generateCsrfToken?: (req: TensoRequest, res: TensoResponse) => string;
  host: string;
  hypermedia: HypermediaConfig;
  jsonIndent: number;
  logging: LoggingConfig;
  maxBytes: number;
  mimeType: string;
  origins: string[];
  pageSize: number;
  parsers: Map<string, ParserFunction>;
  port: number;
  prometheus: PrometheusConfig;
  rate: RateConfig;
  rates: Map<string, RateLimitState>;
  renderers: Map<string, RendererFunction>;
  security: SecurityConfig;
  serializers: Map<string, SerializerFunction>;
  server: Server | HttpsServer | null;
  session: SessionConfig;
  ssl: SslConfig;
  title: string;
  version: string;
  webroot: WebrootConfig;

  /**
   * Creates an instance of Tenso
   */
  constructor(config?: Partial<TensoConfig>);

  /**
   * Checks if a given HTTP method can modify data
   */
  canModify(method: string): boolean;

  /**
   * Handles connection setup for incoming requests
   */
  connect(req: TensoRequest, res: TensoResponse): void;

  /**
   * Creates an EventSource instance
   */
  eventsource(...args: any[]): any;

  /**
   * Final processing step in the request pipeline
   */
  final(req: TensoRequest, res: TensoResponse, data: any): any;

  /**
   * Handles response headers, particularly caching headers
   */
  headers(req: TensoRequest, res: TensoResponse): void;

  /**
   * Initializes the Tenso server with middleware, routes, and configuration
   */
  init(): this;

  /**
   * Registers a parser for a specific media type
   */
  parser(mediatype?: string, fn?: ParserFunction): this;

  /**
   * Handles rate limiting for incoming requests
   */
  rateLimit(req: TensoRequest, fn?: (req: TensoRequest, state: RateLimitState) => RateLimitState): RateLimitResult;

  /**
   * Renders the response based on the accepted content type
   */
  render(req: TensoRequest, res: TensoResponse, data: any): any;

  /**
   * Registers a renderer for a specific media type
   */
  renderer(mediatype: string, fn: RendererFunction): this;

  /**
   * Registers a serializer for a specific media type
   */
  serializer(mediatype: string, fn: SerializerFunction): this;

  /**
   * Sets up signal handlers for graceful server shutdown
   */
  signals(): this;

  /**
   * Starts the HTTP or HTTPS server
   */
  start(): this;

  /**
   * Stops the server
   */
  stop(): this;
}

/**
 * Factory function that creates and initializes a Tenso server instance
 */
export declare function tenso(userConfig?: Partial<TensoConfig>): Tenso;

export default tenso; 