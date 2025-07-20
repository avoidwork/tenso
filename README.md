# Tenso

_Lightweight HTTP REST API framework with built-in hypermedia support_

[![npm version](https://badge.fury.io/js/tenso.svg)](https://badge.fury.io/js/tenso)
[![Node.js Version](https://img.shields.io/node/v/tenso.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Build Status](https://github.com/avoidwork/tenso/actions/workflows/ci.yml/badge.svg)](https://github.com/avoidwork/tenso/actions)

## 🚀 Features

* **REST/Hypermedia**: Automatic hypermedia link generation and pagination
* **Multiple Authentication**: Basic, Bearer Token, JWT, OAuth2, SAML support
* **Flexible Routing**: Express-style routing with middleware support
* **Content Negotiation**: Automatic serialization for JSON, XML, YAML, CSV, HTML
* **Security Built-in**: CORS, CSRF tokens, rate limiting, security headers
* **Session Management**: Memory or Redis-based sessions
* **EventSource Streams**: Built-in server-sent events support
* **File Serving**: Static file serving with directory browsing
* **Prometheus Metrics**: Built-in metrics collection
* **TypeScript Support**: Full TypeScript definitions included

## 📦 Installation

```bash
# npm
npm install tenso

# yarn
yarn add tenso

# pnpm
pnpm add tenso
```

## 🚀 Quick Start

### Basic Server

```javascript
import {tenso} from "tenso";

export const app = tenso();

app.get("/", "Hello, World!");
app.start();
```

### REST API with Routes

```javascript
import {tenso} from "tenso";
import {randomUUID as uuid} from "crypto";

const initRoutes = {
	"get": {
		"/": ["reports", "uuid"],
		"/reports": ["tps"],
		"/reports/tps": (req, res) => res.error(785, Error("TPS Cover Sheet not attached")),
		"/uuid": (req, res) => res.send(uuid(), 200, {"cache-control": "no-cache"})
	}
};

export const app = tenso({initRoutes});
app.start();
```

### Using the Class

```javascript
import {Tenso} from "tenso";

class MyAPI extends Tenso {
  constructor() {
    super({
      auth: {
        protect: ["/api/private"]
      },
      defaultHeaders: {
        "x-api-version": "1.0.0"
      }
    });
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    this.get("/api/health", this.healthCheck);
    this.post("/api/users", this.createUser);
  }
  
  healthCheck(req, res) {
    res.json({status: "healthy", timestamp: new Date().toISOString()});
  }
  
  createUser(req, res) {
    // Handle user creation
    res.status(201).json({message: "User created"});
  }
}

const api = new MyAPI();
```

## 📖 Table of Contents

- [Creating Routes](#creating-routes)
- [Request and Response Helpers](#request-and-response-helpers)
- [Extensibility](#extensibility)
- [Responses](#responses)
- [REST / Hypermedia](#rest--hypermedia)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Sessions](#sessions)
- [Security](#security)
- [Rate Limiting](#rate-limiting)
- [Upload Size Limiting](#upload-size-limiting)
- [Logging](#logging)
- [HTML Renderer](#html-renderer)
- [Serving Files](#serving-files)
- [EventSource Streams](#eventsource-streams)
- [Prometheus](#prometheus)
- [Benchmarks](#benchmarks)
- [Testing](#testing)
- [TypeScript](#typescript)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🛤️ Creating Routes

Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server.

You can use `res` to:
- `res.send(body[, status, headers])`
- `res.redirect(url)`
- `res.error(status[, Error])`

### Route Types

#### Protected Routes
Protected routes require authorization for access and will redirect to authentication endpoints if needed.

#### Unprotected Routes
Unprotected routes do not require authorization for access and will exit the authorization pipeline early to avoid rate limiting, CSRF tokens, & other security measures. These routes are the DMZ of your API! _You_ **must** secure these endpoints with alternative methods if accepting input!

#### Exit Routes
As of 17.2.0 you can have routes exit the middleware pipeline immediately by setting them in the `exit` Array. This differs from `unprotect` as there is no request body handling.

#### Reserved Route
The `/assets/*` route is reserved for the HTML browsable interface assets; please do not try to reuse this for data.

### Advanced Routing Examples

```javascript
// Middleware for all requests
export const always = {
  "/": (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  }
};

// Protected routes with authentication
export const get = {
  "/admin": (req, res) => {
    // Only accessible after authentication
    res.json({admin: true});
  }
};

// Route parameters
export const get = {
  "/users/:id": (req, res) => {
    const userId = req.params.id;
    res.json({id: userId});
  }
};
```

## 🔧 Request and Response Helpers

### Request Helpers
Tenso decorates `req` with helpers such as:
- `req.allow` - Allowed HTTP methods
- `req.csrf` - CSRF token information
- `req.ip` - Client IP address
- `req.parsed` - Parsed URL information
- `req.private` - Private route flag
- `req.body` - Request payload for `PATCH`, `PUT`, & `POST` requests
- `req.session` - Session data when using `local` authentication

### Response Helpers
Tenso decorates `res` with helpers such as:
- `res.send()` - Send response with optional status and headers
- `res.status()` - Set response status
- `res.json()` - Send JSON response
- `res.redirect()` - Send redirect response
- `res.error()` - Send error response

## 🎛️ Extensibility

Tenso is extensible and can be customized with custom parsers, renderers, & serializers.

### Parsers

Custom parsers can be registered with `server.parser('mimetype', fn);` or directly on `server.parsers`. The parameters for a parser are `(arg)`.

Tenso has built-in parsers for:
- `application/json`
- `application/x-www-form-urlencoded`
- `application/jsonl`
- `application/json-lines`
- `text/json-lines`

### Renderers

Custom renderers can be registered with `server.renderer('mimetype', fn);`. The parameters for a renderer are `(req, res, arg)`.

Tenso has built-in renderers for:
- `application/javascript`
- `application/json`
- `application/jsonl`
- `application/json-lines`
- `text/json-lines`
- `application/yaml`
- `application/xml`
- `text/csv`
- `text/html`

### Serializers

Custom serializers can be registered with `server.serializer('mimetype', fn);`. The parameters for a serializer are `(arg, err, status = 200, stack = false)`.

Tenso has two default serializers which can be overridden:
- `plain` - for plain text responses
- `custom` - for standard response shape

```json
{
  "data": null,
  "error": null,
  "links": [],
  "status": 200
}
```

## 📤 Responses

Responses will have a standard shape and will be UTF-8 by default. The result will be in `data`. Hypermedia (pagination & links) will be in `links: [{"uri": "...", "rel": "..."}, ...]`, & also in the `Link` HTTP header.

Page size can be specified via the `page_size` parameter, e.g. `?page_size=25`.

Sort order can be specified via the `order-by` parameter which accepts `[field ]asc|desc` & can be combined like an SQL 'ORDER BY', e.g. `?order_by=desc` or `?order_by=lastName%20asc&order_by=firstName%20asc&order_by=age%20desc`

## 🌐 REST / Hypermedia

Hypermedia is a prerequisite of REST and is best described by the [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tenso will automatically paginate Arrays of results, or parse Entity representations for keys that imply relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

Tenso will bend the rules of REST when using authentication strategies provided by passport.js, or CSRF if enabled, because they rely on a session. Session storage is in memory or Redis. You have the option of a stateless or stateful API.

Hypermedia processing of the response body can be disabled as of `10.2.0` by setting `req.hypermedia = false` and/or `req.hypermediaHeader` via middleware.

## ⚙️ Configuration

Tenso provides comprehensive configuration options to customize every aspect of your server. All configuration options are optional - provide only what you need to override the sensible defaults.

### Core Server Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `"0.0.0.0"` | Server host address to bind to |
| `port` | number | `8000` | Server port number to listen on |
| `title` | string | `"tenso"` | Application title for branding and display |
| `version` | string | `auto` | Framework version (auto-detected) |
| `silent` | boolean | `false` | Suppress console output and logging |
| `maxListeners` | number | `25` | Maximum number of event listeners |

### Content & Response Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mimeType` | string | `"application/json"` | Default MIME type for responses |
| `charset` | string | `"utf-8"` | Default character encoding for responses |
| `jsonIndent` | number | `0` | JSON response indentation level (0 = minified) |
| `digit` | number | `3` | Number of decimal places for numeric formatting |
| `renderHeaders` | boolean | `true` | Include headers in rendered output responses |
| `time` | boolean | `true` | Include timing information in response headers |
| `etags` | boolean | `true` | Enable ETag generation for response caching |

### Default Headers

```javascript
{
  defaultHeaders: {
    "content-type": "application/json; charset=utf-8",
    "vary": "accept, accept-encoding, accept-language, origin"
  }
}
```

### CORS Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origins` | Array<string> | `["*"]` | Allowed CORS origins |
| `corsExpose` | string | `"cache-control, content-language, content-type, expires, last-modified, pragma"` | CORS exposed headers |

### Caching Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheSize` | number | `1000` | Maximum number of items in memory cache |
| `cacheTTL` | number | `300000` | Cache time-to-live in milliseconds (5 minutes) |

### Request Handling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxBytes` | number | `0` | Maximum request body size in bytes (0 = unlimited) |
| `catchAll` | boolean | `true` | Enable catch-all route handling for unmatched requests |
| `exit` | Array | `[]` | Exit handlers to execute on server shutdown |

### Pagination & Hypermedia

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pageSize` | number | `5` | Default pagination page size |
| `hypermedia.enabled` | boolean | `true` | Enable hypermedia links in responses |
| `hypermedia.header` | boolean | `true` | Include hypermedia links in response headers |

### Static File Serving

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoindex` | boolean | `false` | Enable automatic directory indexing for static files |
| `webroot.root` | string | `"www/"` | Document root directory for static files |
| `webroot.static` | string | `"/assets"` | Static assets directory path |
| `webroot.template` | string | `"template.html"` | Template file path for rendered responses |

### Authentication Configuration

The `auth` object controls all authentication-related settings:

#### Basic Authentication
```javascript
{
  auth: {
    basic: {
      enabled: false,        // Enable basic authentication
      list: []              // Array of "username:password" strings
    }
  }
}
```

#### Bearer Token Authentication
```javascript
{
  auth: {
    bearer: {
      enabled: false,        // Enable bearer token authentication
      tokens: []            // Array of valid bearer tokens
    }
  }
}
```

#### JWT Authentication
```javascript
{
  auth: {
    jwt: {
      enabled: false,        // Enable JWT authentication
      auth: null,           // Custom JWT authentication function
      audience: "",         // JWT audience claim
      algorithms: [         // Allowed JWT signing algorithms
        "HS256", "HS384", "HS512"
      ],
      ignoreExpiration: false, // Ignore JWT expiration
      issuer: "",           // JWT issuer claim
      scheme: "Bearer",     // JWT authentication scheme
      secretOrKey: ""       // JWT secret or private key
    }
  }
}
```

#### OAuth2 Authentication
```javascript
{
  auth: {
    oauth2: {
      enabled: false,        // Enable OAuth2 authentication
      auth: null,           // Custom OAuth2 authentication function
      auth_url: "",         // OAuth2 authorization URL
      token_url: "",        // OAuth2 token URL
      client_id: "",        // OAuth2 client ID
      client_secret: ""     // OAuth2 client secret
    }
  }
}
```

#### SAML Authentication
```javascript
{
  auth: {
    saml: {
      enabled: false,        // Enable SAML authentication
      auth: null            // Custom SAML authentication function
    }
  }
}
```

#### Authentication Routes & Protection
```javascript
{
  auth: {
    delay: 0,             // Authentication delay in milliseconds
    protect: [],          // Routes requiring authentication (regex patterns)
    unprotect: [],        // Routes excluded from authentication
    uri: {
      login: "/auth/login",    // Login endpoint URI
      logout: "/auth/logout",  // Logout endpoint URI
      redirect: "/",          // Post-authentication redirect URI
      root: "/auth"           // Authentication root URI
    },
    msg: {
      login: "POST 'username' & 'password' to authenticate"
    }
  }
}
```

### Security Configuration

```javascript
{
  security: {
    key: "x-csrf-token",     // CSRF token header name
    secret: "tenso",         // CSRF secret key
    csrf: true,              // Enable CSRF protection
    csp: null,               // Content Security Policy header value
    xframe: "SAMEORIGIN",    // X-Frame-Options header value
    p3p: "",                 // P3P privacy policy header value
    hsts: null,              // HTTP Strict Transport Security header
    xssProtection: true,     // Enable X-XSS-Protection header
    nosniff: true           // Enable X-Content-Type-Options: nosniff
  }
}
```

### Session Management

```javascript
{
  session: {
    cookie: {
      httpOnly: true,        // Set httpOnly flag on session cookies
      path: "/",            // Session cookie path
      sameSite: true,       // Enable SameSite cookie attribute
      secure: "auto"        // Secure cookie setting ("auto", true, false)
    },
    name: "tenso.sid",      // Session cookie name
    proxy: true,            // Trust proxy for secure cookies
    redis: {
      host: "127.0.0.1",    // Redis host address
      port: 6379            // Redis port number
    },
    rolling: true,          // Enable rolling session expiration
    resave: true,           // Force session save even if not modified
    saveUninitialized: true, // Save uninitialized sessions
    secret: "tensoABC",     // Session signing secret
    store: "memory"         // Session store type ("memory", "redis")
  }
}
```

### Rate Limiting

```javascript
{
  rate: {
    enabled: false,         // Enable rate limiting
    limit: 450,            // Maximum requests per time window
    message: "Too many requests", // Rate limit exceeded message
    override: null,         // Custom rate limit override function
    reset: 900,            // Rate limit reset window in seconds
    status: 429            // HTTP status code for rate limit responses
  }
}
```

### Logging Configuration

```javascript
{
  logging: {
    enabled: true,          // Enable logging output
    format: "%h %l %u %t \"%r\" %>s %b", // Log message format
    level: "debug",         // Minimum log level to output
    stack: true            // Include stack traces in error logs
  }
}
```

### Prometheus Metrics

```javascript
{
  prometheus: {
    enabled: false,         // Enable Prometheus metrics collection
    metrics: {
      includeMethod: true,      // Include HTTP method in metrics
      includePath: true,        // Include request path in metrics
      includeStatusCode: true,  // Include status code in metrics
      includeUp: true,         // Include uptime metrics
      buckets: [               // Histogram buckets for response times
        0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 
        15, 20, 25, 30, 35, 40, 50, 70, 100, 200
      ],
      customLabels: {}         // Custom metric labels
    }
  }
}
```

### SSL/TLS Configuration

```javascript
{
  ssl: {
    cert: null,             // SSL certificate file path or content
    key: null,              // SSL private key file path or content
    pfx: null              // SSL PFX file path or content
  }
}
```

### Route Initialization

```javascript
{
  initRoutes: {
    // Define routes to be registered on startup
    get: {
      "/health": (req, res) => res.json({status: "ok"})
    },
    post: {
      "/users": userController.create
    },
    always: {
      // Middleware that runs for all requests
      "/": authMiddleware
    }
  }
}
```

### Complete Example Configuration

Here's a production-ready configuration example:

```javascript
import {tenso} from "tenso";

const app = tenso({
  // Server settings
  host: "0.0.0.0",
  port: process.env.PORT || 3000,
  title: "My API",
  
  // Security
  auth: {
    jwt: {
      enabled: true,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ["HS256"]
    },
    protect: ["/api/private"]
  },
  
  security: {
    csrf: true,
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  },
  
  // Performance
  rate: {
    enabled: true,
    limit: 1000,
    reset: 3600
  },
  
  // Monitoring
  prometheus: {
    enabled: true
  },
  
  // Session management
  session: {
    store: "redis",
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379
    },
    secret: process.env.SESSION_SECRET
  },
  
  // SSL in production
  ssl: {
    cert: process.env.SSL_CERT_PATH,
    key: process.env.SSL_KEY_PATH
  }
});
```

### Environment-Specific Configurations

#### Development
```javascript
const devConfig = {
  logging: {level: "debug"},
  rate: {enabled: false},
  security: {csrf: false},
  ssl: {cert: null, key: null}
};
```

#### Production
```javascript
const prodConfig = {
  logging: {level: "warn"},
  rate: {enabled: true, limit: 1000},
  security: {csrf: true, hsts: {maxAge: 31536000}},
  session: {store: "redis"},
  prometheus: {enabled: true}
};
```
```

## 🔐 Authentication

The `protect` Array contains the endpoints that will require authentication. The `redirect` String is the endpoint users will be redirected to upon successfully authenticating; the default is `/`.

Sessions are used for non-`Basic` or `Bearer Token` authentication and will have `/login`, `/logout`, & custom routes. Redis is supported for session storage.

Multiple authentication strategies can be enabled at once.

Authentication attempts have a random delay to deal with "timing attacks"; always rate limit in production environments!

### Basic Auth

```javascript
{
	"auth": {
		"basic": {
			"enabled": true,
			"list": ["username:password"]
		},
		"protect": ["/"]
	}
}
```

### JSON Web Token

JSON Web Token (JWT) authentication is stateless and does not have an entry point. The `auth(token, callback)` function must verify `token.sub` and must execute `callback(err, user)`.

This authentication strategy relies on out-of-band information for the `secret` and other optional token attributes.

```javascript
{
	"auth": {
		"jwt": {
			"enabled": true,
			"auth": function (token, cb) { /* Authentication handler to 'find' or 'create' a User */ },
			"algorithms": ["HS256", "HS384", "HS512"], // Optional signing algorithms
			"audience": "", // Optional, used to verify 'aud'
			"issuer": "", // Optional, used to verify 'iss'
			"ignoreExpiration": false, // Optional, set to true to ignore expired tokens
			"scheme": "Bearer", // Optional, set to specify the Authorization scheme
			"secretOrKey": ""
		},
		"protect": ["/private"]
	}
}
```

### OAuth2

OAuth2 authentication will create `/auth`, `/auth/oauth2`, & `/auth/oauth2/callback` routes. `auth(accessToken, refreshToken, profile, callback)` must execute `callback(err, user)`.

```javascript
{
	"auth": {
		"oauth2": {
			"enabled": true,
			"auth": function (accessToken, refreshToken, profile, callback) { /* Authentication handler */ },
			"auth_url": "", // Authorization URL
			"token_url": "", // Token URL
			"client_id": "", // Get this from authorization server
			"client_secret": "" // Get this from authorization server
		},
		"protect": ["/private"]
	}
}
```

### OAuth2 Bearer Token

```javascript
{
	"auth": {
		"bearer": {
			"enabled": true,
			"tokens": ["abc", "def", "xyz"]
		},
		"protect": ["/"]
	}
}
```

### SAML

SAML authentication will create `/auth`, `/auth/saml`, & `/auth/saml/callback` routes. `auth(profile, callback)` must execute `callback(err, user)`.

Tenso uses [passport-saml](https://github.com/bergie/passport-saml); for configuration options please visit its homepage.

```javascript
{
	"auth": {
		"saml": {
			"enabled": true
			// Additional SAML configuration options go here
		},
		"protect": ["/private"]
	}
}
```

## 💾 Sessions

Sessions can use a memory (default) or Redis store. Memory will limit your sessions to a single server instance, while Redis will allow you to share sessions across a cluster of processes or machines. To use Redis, set the `store` property to "redis".

If the session `secret` is not provided, a version 4 UUID will be used.

```javascript
{
	"session": {
		"cookie": {
			"httpOnly": true,
			"path": "/",
			"sameSite": true,
			"secure": false
		},
		"name": "tenso.sid",
		"proxy": true,
		"redis": {
			"host": "127.0.0.1",
			"port": 6379
		},
		"rolling": true,
		"resave": true,
		"saveUninitialized": true,
		"secret": "tensoABC",
		"store": "memory"
	}
}
```

## 🔒 Security

Tenso uses [helmet](https://helmetjs.github.io/) for security headers as middleware. Please see its documentation for how to configure it; each method & argument is a key:value pair for `security`.

```javascript
{
	"security": {
		"key": "x-csrf-token",
		"secret": "",
		"csrf": true,
		"csp": null,
		"xframe": "",
		"p3p": "",
		"hsts": null,
		"xssProtection": true,
		"nosniff": true
	}
}
```

## 🚦 Rate Limiting

Rate limiting is controlled by configuration and is disabled by default. Rate limiting is based on `token`, `session`, or `ip`, depending upon authentication method.

Rate limiting can be overridden by providing an `override` function that takes `req` & `rate` and must return a (modified) `rate`.

```javascript
{
	"rate": {
		"enabled": true,
		"limit": 450, // Maximum requests allowed before reset
		"reset": 900, // TTL in seconds
		"status": 429, // Optional HTTP status
		"message": "Too many requests", // Optional error message
		"override": function (req, rate) { /* Override the default rate limiting */ }
	}
}
```

## 📁 Upload Size Limiting

A 'max byte' limit can be enforced on all routes that handle `PATCH`, `POST`, & `PUT` requests. The default limit is 0 (unlimited).

```javascript
{
	"maxBytes": 5242880 // 5MB limit
}
```

## 📊 Logging

Standard log levels are supported and are emitted to `stdout` & `stderr`. Stack traces can be enabled.

```javascript
{
	"logging": {
		"level": "warn",
		"enabled": true,
		"stack": true
	}
}
```

## 🎨 HTML Renderer

The HTML template can be overridden with a custom HTML document.

Dark mode is supported! The `dark` class will be added to the `body` tag if the user's browser is in dark mode.

```javascript
{
	"webroot": {
		"root": "/full/path/to/webroot",
		"static": "/assets",
		"template": "template.html"
	}
}
```

## 📁 Serving Files

Custom file routes can be created like this:

```javascript
app.files("/folder", "/full/path/to/parent");
```

## 📡 EventSource Streams

Create & cache an `EventSource` stream to send messages to a Client. See [tiny-eventsource](https://github.com/avoidwork/tiny-eventsource) for configuration options:

```javascript
const streams = new Map();

// Route handler
"/stream": (req, res) => {
	const id = req.user.userId;

	if (streams.has(id) === false) {
		streams.set(id, req.server.eventsource({ms: 30000}, "initialized"));
	}

	streams.get(id).init(req, res);
}

// Send data to Clients
streams.get(id).send({message: "Hello, World!"});
```

## 📈 Prometheus

Prometheus metrics can be enabled by setting `{prometheus: {enabled: true}}`. The metrics will be available at `/metrics`.

```javascript
{
	"prometheus": {
		"enabled": true,
		"metrics": {
			"includeMethod": true,
			"includePath": true,
			"includeStatusCode": true,
			"includeUp": true,
			"buckets": [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200],
			"customLabels": {}
		}
	}
}
```

## ⚡ Benchmarks

Tenso includes a comprehensive benchmark suite for performance analysis and optimization. The benchmark suite tests all major framework components including HTTP handling, authentication, parsing, rendering, serialization, hypermedia generation, rate limiting, memory usage, and real-world load testing.

### Performance Overview

Tenso demonstrates excellent performance characteristics:

- **Peak Performance**: 34,817 RPS (requests per second)
- **Average Response Time**: 0.0ms minimum latency
- **Reliability**: 99.993% success rate (0.007% error rate)
- **Total Requests Processed**: 6.4+ million in comprehensive testing
- **Hypermedia Impact**: ~10% performance cost when enabled

### Available Benchmarks

#### 1. Basic HTTP Performance (`basic-http.js`)
Tests fundamental HTTP request/response performance:
- **Request/Response Cycle**: Basic rendering performance  
- **JSON Serialization**: Performance of JSON output formatting
- **Different Data Sizes**: Impact of response size on performance

#### 2. Authentication (`auth.js`)
Tests authentication middleware performance:
- **Basic Auth**: Username/password validation
- **Bearer Token**: Token-based authentication
- **JWT Processing**: JSON Web Token validation
- **Route Protection**: Pattern matching for protected routes
- **Session Auth**: Session-based authentication

#### 3. Parsers (`parsers.js`)
Tests request body parsing performance:
- **JSON Parser**: `application/json` content parsing
- **JSONL Parser**: `application/jsonl` line-delimited JSON parsing  
- **Form Parser**: `application/x-www-form-urlencoded` parsing
- **Memory Usage**: Parser memory consumption

#### 4. Renderers (`renderers.js`)
Tests response rendering performance:
- **JSON Rendering**: JSON output formatting
- **XML Rendering**: XML output with proper escaping
- **CSV Rendering**: Tabular data formatting
- **YAML Rendering**: YAML output formatting
- **Plain Text Rendering**: Simple text output
- **HTML Rendering**: HTML output with proper escaping
- **JavaScript Rendering**: JSONP callback formatting

#### 5. Serializers (`serializers.js`)
Tests data serialization performance for response processing:
- **Custom Serializer**: Structured response objects with metadata
- **Plain Serializer**: Direct data or error information return
- **Error Handling**: Error serialization with/without stack traces
- **MIME Type Support**: Serialization for different content types
- **Status Code Handling**: Different HTTP status code scenarios

#### 6. Rate Limiting (`rate-limiting.js`)
Tests rate limiting performance and accuracy:
- **Basic Rate Limiting**: Request counting and limiting
- **Different Limits**: Impact of limit values on performance
- **Window Reset**: Rate limit window management
- **High Concurrency**: Performance under heavy load
- **Cleanup**: Expired entry removal performance

#### 7. Hypermedia (`hypermedia.js`)
Tests HATEOAS link generation performance:
- **Link Generation**: Creating hypermedia links from data
- **Pagination Links**: Navigation link creation
- **Pattern Matching**: ID and URL pattern recognition
- **Link Deduplication**: Duplicate link removal
- **Link Headers**: HTTP Link header generation

#### 8. Memory Usage (`memory.js`)
Tests memory consumption and leak detection:
- **Server Lifecycle**: Memory usage during start/stop
- **Request Processing**: Memory per request
- **Parser Memory**: Memory usage by parsers
- **Renderer Memory**: Memory usage by renderers
- **Rate Limit Memory**: Memory growth with clients
- **Leak Detection**: Long-running memory pattern analysis

#### 9. Load Testing (`load-test.js`)
Real-world load testing using autocannon:
- **Basic Load Tests**: Various connection levels
- **POST Request Tests**: Request body handling under load
- **Format Tests**: Different response formats under load
- **Rate Limit Tests**: Rate limiting behavior under load
- **Hypermedia Comparison**: Performance with/without hypermedia
- **Stress Tests**: High-connection scenarios
- **Mixed Workloads**: Realistic usage patterns

### Running Benchmarks

```bash
# Run all benchmarks
npm run benchmark

# Run comprehensive load test
npm run benchmark:load-test

# Run individual benchmark suites
npm run benchmark:basic      # Basic HTTP performance
npm run benchmark:auth       # Authentication performance
npm run benchmark:parsers    # Request parsing performance
npm run benchmark:renderers  # Response rendering performance
npm run benchmark:serializers # Data serialization performance  
npm run benchmark:rate       # Rate limiting performance
npm run benchmark:hypermedia # Hypermedia link generation
npm run benchmark:memory     # Memory usage analysis
```

### Latest Load Test Results

#### Overall Performance Summary
```
📊 Load Test Summary Report
======================================================================
| Test Category      | Avg RPS  | Avg Latency | P99 Latency | Error Rate |
|--------------------------------------------------------------------|
| Basic Tests        | 21,899.0 |       3.1ms |       3.8ms |      0.00% |
| POST Tests         | 20,522.1 |       0.7ms |       1.0ms |      0.00% |
| Format Tests       | 10,634.8 |       1.7ms |       2.3ms |      0.00% |
| Rate Limit         | 19,460.3 |       0.8ms |       1.3ms |      0.00% |
| Parameterized      | 27,718.9 |       0.1ms |       1.0ms |      0.00% |
| Mixed Load         | 25,590.4 |       1.0ms |       1.0ms |      0.00% |
| Hypermedia Enabled | 18,665.7 |       3.2ms |       4.3ms |      0.00% |
| Hypermedia Disabled| 20,694.6 |       3.2ms |       3.8ms |      0.00% |
| Stress Tests       | 18,009.3 |      27.2ms |      54.8ms |      0.05% |
|--------------------------------------------------------------------|

🎯 Key Metrics:
  Total tests run: 29
  Total requests: 6,494,748
  Total errors: 484
  Overall error rate: 0.01%
  Best RPS: 33,987.6
  Worst RPS: 828.4
  Best latency: 0.0ms
  Worst latency: 60.5ms
```

#### Hypermedia Performance Impact
```
Performance Comparison: Hypermedia Enabled vs Disabled

Test Type                    | With Hypermedia | Without Hypermedia | Improvement
----------------------------|-----------------|-------------------|------------
Ping Test (Simple)         |   29,805.82 RPS |     33,318.55 RPS |     +11.8%
JSON Response               |   16,601.82 RPS |     17,472.73 RPS |      +5.2%
Large JSON Response         |      894.50 RPS |        902.90 RPS |      +0.9%
Parameterized Route         |   27,360.73 RPS |     31,084.37 RPS |     +13.6%

Average Performance Impact: ~10.9% improvement when disabling hypermedia
```

#### Response Format Performance
```
Format                      | Avg RPS      | Avg Latency | Throughput
----------------------------|--------------|-------------|------------
JSON                        |   17,141 RPS |       1.0ms |  122 MB/sec
XML                         |    5,948 RPS |       2.8ms |   78 MB/sec
CSV                         |   10,987 RPS |       1.1ms |   90 MB/sec
YAML                        |    8,675 RPS |       2.0ms |   60 MB/sec
```

#### Stress Test Results
```
Test Scenario               | Connections | Duration | Avg RPS    | P99 Latency
----------------------------|-------------|----------|------------|------------
High Connections            |         200 |      15s | 28,334 RPS |       8ms
Very High Connections       |         500 |      10s | 25,298 RPS |     121ms
JSON High Load              |         100 |      15s | 16,170 RPS |       6ms
Large Response High Load    |          50 |      10s |    828 RPS |      97ms
```

### Performance Targets

#### Excellent Performance
- **HTTP Requests**: >5,000 RPS for simple responses
- **Authentication**: >40,000 checks/sec
- **Parsing**: >10,000 operations/sec for medium payloads
- **Rendering**: >5,000 operations/sec for JSON
- **Rate Limiting**: >100,000 checks/sec
- **Memory**: <100 bytes per client session

#### Good Performance
- **HTTP Requests**: >2,000 RPS
- **Average Latency**: <10ms
- **99th Percentile**: <50ms
- **Memory Growth**: <5MB over 1,000 operations
- **Error Rate**: <0.1%

#### Warning Signs
- **Consistent Memory Growth**: Potential memory leaks
- **High Latency**: >100ms average response time
- **High Error Rates**: >1% error rate
- **Poor Throughput**: <500 RPS for simple operations

### Running with Profiling

For detailed performance analysis:

```bash
# Run with garbage collection exposed for better memory benchmarking
node --expose-gc benchmarks/memory.js

# Profile CPU usage
node --prof benchmarks/basic-http.js
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools integration
node --inspect benchmarks/load-test.js

# Using clinic.js (install separately)
clinic doctor -- node benchmarks/basic-http.js
```

### Performance Tips

For accurate benchmark results:

1. **Close other applications** to reduce system noise
2. **Run multiple times** to establish consistency patterns
3. **Use consistent hardware** for meaningful comparisons
4. **Monitor system resources** during testing
5. **Consider CPU scaling** on laptops (disable turbo boost)
6. **Build the project first** with `npm run build`

### Understanding Results

- **ops/sec**: Operations per second (higher is better)
- **±percentage**: Margin of error (lower is better)
- **runs sampled**: Number of test iterations for statistical validity
- **Req/Sec**: Requests per second for load tests
- **Latency percentiles**: Response time distribution across requests

### Troubleshooting

**"Cannot find module" errors**: Ensure you've built the project first with `npm run build` in the root directory.

**High memory usage**: Some benchmarks intentionally stress memory - monitor system resources.

**Port conflicts**: Benchmarks use random ports, but conflicts can occur with concurrent tests.

**Timeout errors**: Reduce iteration counts or test duration for slower systems.

For comprehensive documentation, configuration options, CI integration, and troubleshooting, see the detailed guide at `benchmarks/README.md`.

## 🧪 Testing

Tenso is built on top of [woodland](https://github.com/avoidwork/woodland), which provides the core HTTP functionality and routing.

### Writing Tests

```javascript
import {tenso} from "tenso";
import assert from "node:assert";

describe("My API", () => {
  let app;
  
  beforeEach(() => {
    app = tenso();
  });
  
  it("should respond to GET /", async () => {
    app.get("/", (req, res) => res.send("Hello"));
    
    const req = {method: "GET", url: "/", headers: {}};
    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (k, v) => res.headers[k] = v,
      end: (body) => res.body = body
    };
    
    app.route(req, res);
    assert.equal(res.body, "Hello");
  });
});
```

## 🔍 Examples

### REST API with Authentication

```javascript
import {tenso} from "tenso";

const app = tenso({
  auth: {
    basic: {
      enabled: true,
      list: ["admin:password"]
    },
    protect: ["/api/private"]
  },
  defaultHeaders: {"content-type": "application/json"}
});

const users = new Map();

// Public routes
app.get("/api/health", (req, res) => {
  res.json({status: "healthy"});
});

// Protected routes
app.get("/api/private/users", (req, res) => {
  res.json(Array.from(users.values()));
});

app.post("/api/private/users", (req, res) => {
  const user = {id: Date.now(), ...req.body};
  users.set(user.id, user);
  res.json(user, 201);
});

app.start();
```

### File Upload API

```javascript
import {tenso} from "tenso";
import {createWriteStream} from "node:fs";
import {pipeline} from "node:stream/promises";

const app = tenso({
  maxBytes: 10485760 // 10MB limit
});

app.post("/upload", async (req, res) => {
  try {
    const filename = req.headers["x-filename"] || "upload.bin";
    const writeStream = createWriteStream(`./uploads/${filename}`);
    
    await pipeline(req, writeStream);
    res.json({message: "Upload successful", filename});
  } catch (error) {
    res.error(500, "Upload failed");
  }
});

app.start();
```

## 🔧 Troubleshooting

### Common Issues

#### Authentication Problems

```javascript
// Problem: Routes not protected
// Solution: Check protect array configuration
const app = tenso({
  auth: {
    basic: {enabled: true, list: ["user:pass"]},
    protect: ["/api/private/*"] // Use wildcard for sub-routes
  }
});
```

#### CORS Issues

```javascript
// Problem: CORS blocked requests
// Solution: Configure origins properly
const app = tenso({
  origins: ["https://myapp.com", "http://localhost:3000"]
});
```

#### Rate Limiting

```javascript
// Problem: Rate limits too strict
// Solution: Adjust rate limiting configuration
const app = tenso({
  rate: {
    enabled: true,
    limit: 1000,     // Increase limit
    reset: 3600      // Longer reset window
  }
});
```

### Debug Mode

```javascript
const app = tenso({
  logging: {
    enabled: true,
    level: "debug"
  }
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

* **Issues**: [GitHub Issues](https://github.com/avoidwork/tenso/issues)
* **Documentation**: [GitHub Wiki](https://github.com/avoidwork/tenso/wiki)

## 📄 License

Copyright (c) 2025 Jason Mulligan

Licensed under the **BSD-3-Clause** license.

---

Built with ❤️ by Jason Mulligan
