import { IncomingMessage, ServerResponse } from 'http';

/**
 * HTTP Request object extended with Tenso-specific properties
 */
export interface TensoRequest extends IncomingMessage {
  /** CSRF protection flag */
  csrf?: boolean;
  /** Hypermedia enabled flag */
  hypermedia?: boolean;
  /** Hypermedia header flag */
  hypermediaHeader?: boolean;
  /** Private route flag */
  private?: boolean;
  /** Protection flag */
  protect?: boolean;
  /** Async protection flag */
  protectAsync?: boolean;
  /** Unprotect flag */
  unprotect?: boolean;
  /** Parsed URL pathname */
  url?: string;
  /** Reference to the Tenso server instance */
  server?: any;
  /** Session ID for rate limiting */
  sessionID?: string;
  /** Client IP address */
  ip?: string;
  /** Parsed URL object */
  parsed?: URL;
  /** CORS flag */
  cors?: boolean;
  /** Request validity flag */
  valid?: boolean;
  /** HTTP method allowed for this route */
  allow?: string;
  /** Route pattern */
  route?: string;
  /** Exit request function */
  exit?: () => void;
}

/**
 * HTTP Response object extended with Tenso-specific properties
 */
export interface TensoResponse extends ServerResponse {
  /** Set response header */
  header(name: string, value: string | number): void;
  /** Remove response header */
  removeHeader(name: string): void;
}

/**
 * Middleware function type compatible with Woodland
 */
export type MiddlewareFunction = (req: TensoRequest, res: TensoResponse, next: (err?: any) => void) => void;

/**
 * Error middleware function type compatible with Woodland
 */
export type ErrorMiddlewareFunction = (err: any, req: TensoRequest, res: TensoResponse, next: (err?: any) => void) => void;

/**
 * Route handler function type
 */
export type RouteHandler = (req: TensoRequest, res: TensoResponse) => any;

/**
 * Parser function type
 */
export type ParserFunction = (data: string) => any;

/**
 * Renderer function type
 */
export type RendererFunction = (req: TensoRequest, res: TensoResponse, data: any, template?: string) => string;

/**
 * Serializer function type
 */
export type SerializerFunction = (req: TensoRequest, res: TensoResponse, data: any) => any;

/**
 * Authentication configuration for Basic auth
 */
export interface BasicAuthConfig {
  /** Whether basic auth is enabled */
  enabled: boolean;
  /** List of username:password combinations */
  list: string[];
}

/**
 * Authentication configuration for Bearer token auth
 */
export interface BearerAuthConfig {
  /** Whether bearer auth is enabled */
  enabled: boolean;
  /** List of valid tokens */
  tokens: string[];
}

/**
 * Authentication configuration for JWT
 */
export interface JWTAuthConfig {
  /** Whether JWT auth is enabled */
  enabled: boolean;
  /** Custom auth function */
  auth: ((req: TensoRequest, res: TensoResponse) => boolean) | null;
  /** JWT audience */
  audience: string;
  /** Allowed JWT algorithms */
  algorithms: string[];
  /** Whether to ignore expiration */
  ignoreExpiration: boolean;
  /** JWT issuer */
  issuer: string;
  /** Authentication scheme */
  scheme: string;
  /** Secret or key for JWT verification */
  secretOrKey: string;
}

/**
 * Authentication configuration for OAuth2
 */
export interface OAuth2AuthConfig {
  /** Whether OAuth2 is enabled */
  enabled: boolean;
  /** Custom auth function */
  auth: ((req: TensoRequest, res: TensoResponse) => boolean) | null;
  /** OAuth2 authorization URL */
  auth_url: string;
  /** OAuth2 token URL */
  token_url: string;
  /** OAuth2 client ID */
  client_id: string;
  /** OAuth2 client secret */
  client_secret: string;
}

/**
 * Authentication configuration for SAML
 */
export interface SAMLAuthConfig {
  /** Whether SAML is enabled */
  enabled: boolean;
  /** Custom auth function */
  auth: ((req: TensoRequest, res: TensoResponse) => boolean) | null;
}

/**
 * Authentication message configuration
 */
export interface AuthMessages {
  /** Login message */
  login: string;
}

/**
 * Authentication URI configuration
 */
export interface AuthURIConfig {
  /** Login endpoint */
  login: string;
  /** Logout endpoint */
  logout: string;
  /** Redirect URL after login */
  redirect: string;
  /** Authentication root path */
  root: string;
}

/**
 * Complete authentication configuration
 */
export interface AuthConfig {
  /** Authentication delay in milliseconds */
  delay: number;
  /** Routes to protect with authentication */
  protect: string[];
  /** Routes to exclude from authentication */
  unprotect: string[];
  /** Basic authentication configuration */
  basic: BasicAuthConfig;
  /** Bearer token authentication configuration */
  bearer: BearerAuthConfig;
  /** JWT authentication configuration */
  jwt: JWTAuthConfig;
  /** Authentication messages */
  msg: AuthMessages;
  /** OAuth2 authentication configuration */
  oauth2: OAuth2AuthConfig;
  /** Authentication URI configuration */
  uri: AuthURIConfig;
  /** SAML authentication configuration */
  saml: SAMLAuthConfig;
}

/**
 * Hypermedia/HATEOAS configuration
 */
export interface HypermediaConfig {
  /** Whether hypermedia is enabled */
  enabled: boolean;
  /** Whether to include hypermedia in headers */
  header: boolean;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Log format string */
  format: string;
  /** Log level */
  level: string;
  /** Whether to include stack traces */
  stack: boolean;
}

/**
 * Prometheus metrics configuration
 */
export interface PrometheusMetricsConfig {
  /** Include HTTP method in metrics */
  includeMethod: boolean;
  /** Include request path in metrics */
  includePath: boolean;
  /** Include status code in metrics */
  includeStatusCode: boolean;
  /** Include default metrics */
  includeUp: boolean;
  /** Histogram buckets for request duration */
  buckets: number[];
  /** Custom labels to add to metrics */
  customLabels: Record<string, string>;
}

/**
 * Prometheus configuration
 */
export interface PrometheusConfig {
  /** Whether Prometheus metrics are enabled */
  enabled: boolean;
  /** Metrics configuration */
  metrics: PrometheusMetricsConfig;
}

/**
 * Rate limiting configuration
 */
export interface RateConfig {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  /** Maximum requests per window */
  limit: number;
  /** Rate limit exceeded message */
  message: string;
  /** Override function for rate limiting */
  override: ((req: TensoRequest, state: any) => any) | null;
  /** Rate limit reset window in seconds */
  reset: number;
  /** HTTP status code for rate limit exceeded */
  status: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** CSRF token header key */
  key: string;
  /** CSRF secret */
  secret: string;
  /** Whether CSRF protection is enabled */
  csrf: boolean;
  /** Content Security Policy header value */
  csp: string | null;
  /** X-Frame-Options header value */
  xframe: string;
  /** P3P header value */
  p3p: string;
  /** HTTP Strict Transport Security header value */
  hsts: string | null;
  /** Whether XSS protection is enabled */
  xssProtection: boolean;
  /** Whether MIME sniffing protection is enabled */
  nosniff: boolean;
}

/**
 * Session cookie configuration
 */
export interface SessionCookieConfig {
  /** HTTP only cookie flag */
  httpOnly: boolean;
  /** Cookie path */
  path: string;
  /** Same site cookie setting */
  sameSite: boolean;
  /** Secure cookie flag */
  secure: string | boolean;
}

/**
 * Session Redis configuration
 */
export interface SessionRedisConfig {
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Cookie configuration */
  cookie: SessionCookieConfig;
  /** Session name */
  name: string;
  /** Proxy trust setting */
  proxy: boolean;
  /** Redis configuration */
  redis: SessionRedisConfig;
  /** Rolling session flag */
  rolling: boolean;
  /** Resave session flag */
  resave: boolean;
  /** Save uninitialized sessions */
  saveUninitialized: boolean;
  /** Session secret */
  secret: string;
  /** Session store type */
  store: string;
}

/**
 * SSL/TLS configuration
 */
export interface SSLConfig {
  /** Path to SSL certificate file */
  cert: string | null;
  /** Path to SSL private key file */
  key: string | null;
  /** Path to SSL PFX file */
  pfx: string | null;
}

/**
 * Web root configuration
 */
export interface WebrootConfig {
  /** Root directory for web files */
  root: string;
  /** Static assets directory */
  static: string;
  /** Template file path */
  template: string;
}

/**
 * Complete Tenso configuration object
 *
 * This configuration object contains all the default settings for a Tenso server instance.
 * It includes settings for authentication, security, logging, caching, middleware, and more.
 */
export interface TensoConfig {
  /** Authentication configuration */
  auth: AuthConfig;
  /** Enable automatic directory indexing for static files */
  autoindex: boolean;
  /** Maximum number of items in memory cache (default: 1000) */
  cacheSize: number;
  /** Cache time-to-live in milliseconds (default: 300000) */
  cacheTTL: number;
  /** Enable catch-all route handling for unmatched requests */
  catchAll: boolean;
  /** Default character encoding for responses (default: "utf-8") */
  charset: string;
  /** CORS exposed headers */
  corsExpose: string;
  /** Default HTTP headers to include in all responses */
  defaultHeaders: Record<string, string>;
  /** Number of decimal places for numeric formatting (default: 3) */
  digit: number;
  /** Enable ETag generation for response caching */
  etags: boolean;
  /** Exit handlers to execute on server shutdown */
  exit: string[];
  /** Server host address to bind to (default: "0.0.0.0") */
  host: string;
  /** Hypermedia/HATEOAS configuration */
  hypermedia: HypermediaConfig;
  /** Index route configuration for root path handling */
  index: any[];
  /** Initial route definitions to register on startup */
  initRoutes: Record<string, Record<string, RouteHandler>>;
  /** JSON response indentation level (default: 0 for minified) */
  jsonIndent: number;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Maximum request body size in bytes (0 = unlimited) */
  maxBytes: number;
  /** Maximum number of event listeners (default: 25) */
  maxListeners: number;
  /** Default MIME type for responses */
  mimeType: string;
  /** Allowed CORS origins (default: ["*"]) */
  origins: string[];
  /** Default pagination page size (default: 5) */
  pageSize: number;
  /** Server port number to listen on (default: 8000) */
  port: number;
  /** Prometheus metrics configuration */
  prometheus: PrometheusConfig;
  /** Rate limiting configuration */
  rate: RateConfig;
  /** Include headers in rendered output responses */
  renderHeaders: boolean;
  /** Include timing information in response headers */
  time: boolean;
  /** Security-related settings */
  security: SecurityConfig;
  /** Session management configuration */
  session: SessionConfig;
  /** Suppress console output and logging */
  silent: boolean;
  /** SSL/TLS configuration */
  ssl: SSLConfig;
  /** Web root and static file serving configuration */
  webroot: WebrootConfig;
  /** Application title */
  title?: string;
  /** Application version */
  version?: string;
}

/**
 * Default configuration object for Tenso framework
 */
export declare const config: TensoConfig; 