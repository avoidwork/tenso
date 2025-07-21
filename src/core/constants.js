import {createRequire} from "node:module";
import {join} from "node:path";
import {fileURLToPath, URL} from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const packagePath = __dirname.includes("src") ? join(__dirname, "..", "..", "package.json") : join(__dirname, "..", "package.json");
const {name, version} = require(packagePath);

// =============================================================================
// HTTP METHODS
// =============================================================================

export const CONNECT = "connect";
export const DELETE = "DELETE";
export const GET = "GET";
export const HEAD = "HEAD";
export const OPTIONS = "OPTIONS";
export const PATCH = "PATCH";
export const POST = "POST";
export const PUT = "PUT";

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const INT_200 = 2e2;
export const INT_204 = 204;
export const INT_206 = 206;
export const INT_300000 = 3e5;
export const INT_304 = 304;
export const INT_400 = 4e2;
export const INT_401 = 401;
export const INT_413 = 413;
export const INT_429 = 429;
export const INT_450 = 450;
export const INT_500 = 5e2;

// =============================================================================
// CONTENT TYPES & HEADERS
// =============================================================================

export const DEFAULT_CONTENT_TYPE = "application/json; charset=utf-8";
export const DEFAULT_VARY = "accept, accept-encoding, accept-language, origin";

export const HEADER_APPLICATION_JAVASCRIPT = "application/javascript";
export const HEADER_APPLICATION_JSON = "application/json";
export const HEADER_APPLICATION_JSONL = "application/jsonl";
export const HEADER_APPLICATION_JSON_LINES = "application/json-lines";
export const HEADER_APPLICATION_XML = "application/xml";
export const HEADER_APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";
export const HEADER_APPLICATION_YAML = "application/yaml";
export const HEADER_TEXT_CSV = "text/csv";
export const HEADER_TEXT_HTML = "text/html";
export const HEADER_TEXT_JSON_LINES = "text/json-lines";
export const HEADER_TEXT_PLAIN = "text/plain";

export const HEADER_ALLOW_GET = "GET, HEAD, OPTIONS";
export const HEADER_CONTENT_DISPOSITION = "content-disposition";
export const HEADER_CONTENT_DISPOSITION_VALUE = "attachment; filename=\"download.csv\"";
export const HEADER_CONTENT_TYPE = "content-type";
export const HEADER_SPLIT = "\" <";
export const HEADER_VARY = "vary";

export const CACHE_CONTROL = "cache-control";
export const CHARSET_UTF8 = "; charset=utf-8";
export const EXPOSE_HEADERS = "cache-control, content-language, content-type, expires, last-modified, pragma";
export const RETRY_AFTER = "retry-after";
export const X_CSRF_TOKEN = "x-csrf-token";
export const X_FORWARDED_PROTO = "x-forwarded-proto";
export const X_POWERED_BY = "x-powered-by";
export const X_RATELIMIT_LIMIT = "x-ratelimit-limit";
export const X_RATELIMIT_REMAINING = "x-ratelimit-remaining";
export const X_RATELIMIT_RESET = "x-ratelimit-reset";
export const SERVER = "server";

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

export const ACCESS_CONTROL = "access-control";
export const ALGORITHMS = "algorithms";
export const ALLOW = "allow";
export const AUDIENCE = "audience";
export const AUTH = "auth";
export const BASIC = "basic";
export const BEARER = "Bearer";
export const COOKIE_NAME = "tenso.sid";
export const EXPOSE = "expose";
export const ISSUER = "issuer";
export const JWT = "jwt";
export const OAUTH2 = "oauth2";
export const PRIVATE = "private";
export const PROTECT = "protect";
export const read = "read";
export const SAMEORIGIN = "SAMEORIGIN";
export const SESSION_SECRET = "tensoABC";
export const UNPROTECT = "unprotect";

// JWT Algorithms
export const HS256 = "HS256";
export const HS384 = "HS384";
export const HS512 = "HS512";

// =============================================================================
// URLS & PATHS
// =============================================================================

export const IP_0000 = "0.0.0.0";
export const IP_127001 = "127.0.0.1";
export const URL_127001 = "http://127.0.0.1";
export const URL_AUTH_LOGIN = "/auth/login";
export const URL_AUTH_LOGOUT = "/auth/logout";
export const URL_AUTH_ROOT = "/auth";
export const PATH_ASSETS = "/assets";
export const METRICS_PATH = "/metrics";

// =============================================================================
// TEMPLATE CONSTANTS
// =============================================================================

export const TEMPLATE_ALLOW = "{{allow}}";
export const TEMPLATE_BODY = "{{body}}";
export const TEMPLATE_CSRF = "{{csrf}}";
export const TEMPLATE_FILE = "template.html";
export const TEMPLATE_FORMATS = "{{formats}}";
export const TEMPLATE_HEADERS = "{{headers}}";
export const TEMPLATE_METHODS = "{{methods}}";
export const TEMPLATE_TITLE = "{{title}}";
export const TEMPLATE_URL = "{{url}}";
export const TEMPLATE_VERSION = "{{version}}";
export const TEMPLATE_YEAR = "{{year}}";

// =============================================================================
// PAGINATION & QUERY PARAMETERS
// =============================================================================

export const ORDER_BY = "order_by";
export const PAGE = "page";
export const PAGE_SIZE = "page_size";
export const FIRST = "first";
export const LAST = "last";
export const NEXT = "next";
export const PREV = "prev";
export const DESC = "desc";

// =============================================================================
// DATA STRUCTURE KEYS
// =============================================================================

export const COLLECTION = "collection";
export const DATA = "data";
export const HEADERS = "headers";
export const ID = "id";
export const ID_2 = "_id";
export const ITEM = "item";
export const LINK = "link";
export const RELATED = "related";
export const REL_URI = "rel, uri";
export const URI = "uri";

// =============================================================================
// NUMERIC CONSTANTS
// =============================================================================

export const INT_NEG_1 = -1;
export const INT_0 = 0;
export const INT_1 = 1;
export const INT_2 = 2;
export const INT_3 = 3;
export const INT_5 = 5;
export const INT_10 = 10;
export const INT_25 = 25;
export const INT_80 = 80;
export const INT_100 = 1e2;
export const INT_443 = 443;
export const INT_900 = 9e2;
export const INT_1000 = 1e3;
export const INT_6379 = 6379;
export const INT_8000 = 8e3;

// =============================================================================
// STRING LITERALS & SYMBOLS
// =============================================================================

export const AUTO = "auto";
export const BOOLEAN = "boolean";
export const CALLBACK = "callback";
export const COLON = ":";
export const COMMA = ",";
export const COMMA_SPACE = ", ";
export const DEBUG = "debug";
export const DOUBLE_SLASH = "//";
export const EMPTY = "";
export const ENCODED_SPACE = "%20";
export const END = "end";
export const EQ = "=";
export const ERROR = "error";
export const FALSE = "false";
export const FORMAT = "format";
export const FUNCTION = "function";
export const G = "g";
export const GT = "&gt;";
export const HTML = "html";
export const HYPHEN = "-";
export const I = "i";
export const IDENT_VAR = "indent=";
export const IE = "ie";
export const LT = "&lt;";
export const NL = "\n";
export const NULL = "null";
export const NUMBER = "number";
export const PERIOD = ".";
export const PIPE = "|";
export const PREV_DIR = "..";
export const S = "s";
export const SLASH = "/";
export const SPACE = " ";
export const STRING = "string";
export const TENSO = "tenso";
export const TRUE = "true";
export const UNDEFINED = "undefined";
export const UNDERSCORE = "_";
export const URI_SCHEME = "://";
export const UTF8 = "utf8";
export const UTF_8 = "utf-8";
export const WILDCARD = "*";
export const WWW = "www";
export const VERSION = version;
export const TITLE = name;

// =============================================================================
// XML CONSTANTS
// =============================================================================

export const XML_ARRAY_NODE_NAME = "item";
export const XML_PROLOG = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

// =============================================================================
// CONFIGURATION & SYSTEM
// =============================================================================

export const INVALID_CONFIGURATION = "Invalid configuration";
export const LOG_FORMAT = "%h %l %u %t \"%r\" %>s %b";
export const MEMORY = "memory";
export const MULTIPART = "multipart";
export const REDIS = "redis";
export const REGEX_REPLACE = ")).*$";

// System signals
export const SIGHUP = "SIGHUP";
export const SIGINT = "SIGINT";
export const SIGTERM = "SIGTERM";

// =============================================================================
// MESSAGES
// =============================================================================

export const MSG_LOGIN = "POST 'username' & 'password' to authenticate";
export const MSG_PROMETHEUS_ENABLED = "Prometheus metrics enabled";
export const MSG_TOO_MANY_REQUESTS = "Too many requests";

// =============================================================================
// HTML Renderer
// =============================================================================
export const WEBROOT_ROOT = join(__dirname, PREV_DIR, WWW);
export const WEBROOT_TEMPLATE = join(__dirname, PREV_DIR, WWW, TEMPLATE_FILE);
