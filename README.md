# Tenso

_Lightweight HTTP REST API framework with built-in hypermedia support_

[![npm version](https://badge.fury.io/js/tenso.svg)](https://badge.fury.io/js/tenso)
[![Node.js Version](https://img.shields.io/node/v/tenso.svg)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/tenso.svg)](https://github.com/avoidwork/tenso/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/avoidwork/tenso.svg?branch=master)](https://travis-ci.org/avoidwork/tenso)

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

This is the default configuration for Tenso, without authentication or SSL. This would be ideal for development, but not production! Enabling SSL is as easy as providing file paths for the certificate and key.

Everything is optional! You can provide as much or as little configuration as you like.

```javascript
{
	auth: {
		delay: 0,
		protect: [],
		unprotect: [],
		basic: {
			enabled: false,
			list: []
		},
		bearer: {
			enabled: false,
			tokens: []
		},
		jwt: {
			enabled: false,
			auth: null,
			audience: "",
			algorithms: [
				"HS256",
				"HS384",
				"HS512"
			],
			ignoreExpiration: false,
			issuer: "",
			scheme: "bearer",
			secretOrKey: ""
		},
		msg: {
			login: "POST 'username' & 'password' to authenticate"
		},
		oauth2: {
			enabled: false,
			auth: null,
			auth_url: "",
			token_url: "",
			client_id: "",
			client_secret: ""
		},
		uri: {
			login: "/auth/login",
			logout: "/auth/logout",
			redirect: "/",
			root: "/auth"
		},
		saml: {
			enabled: false,
			auth: null
		}
	},
	autoindex: false,
	cacheSize: 1000,
	cacheTTL: 300000,
	catchAll: true,
	charset: "utf-8",
	corsExpose: "cache-control, content-language, content-type, expires, last-modified, pragma",
	defaultHeaders: {
		"content-type": "application/json; charset=utf-8",
		"vary": "accept, accept-encoding, accept-language, origin"
	},
	digit: 3,
	etags: true,
	exit: [],
	host: "0.0.0.0",
	hypermedia: {
		enabled: true,
		header: true
	},
	index: [],
	initRoutes: {},
	jsonIndent: 0,
	logging: {
		enabled: true,
		format: "%h %l %u %t \"%r\" %>s %b",
		level: "debug",
		stack: true
	},
	maxBytes: 20480,
	mimeType: "application/json",
	origins: ["*"],
	pageSize: 5,
	port: 8000,
	prometheus: {
		enabled: false,
		metrics: {
			includeMethod: true,
			includePath: true,
			includeStatusCode: true,
			includeUp: true,
			buckets: [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200],
			customLabels: {}
		}
	},
	rate: {
		enabled: false,
		limit: 450,
		message: "Too many requests",
		override: null,
		reset: 900,
		status: 429
	},
	renderHeaders: true,
	time: true,
	security: {
		key: "x-csrf-token",
		secret: "",
		csrf: true,
		csp: null,
		xframe: "",
		p3p: "",
		hsts: null,
		xssProtection: true,
		nosniff: true
	},
	session: {
		cookie: {
			httpOnly: true,
			path: "/",
			sameSite: true,
			secure: "auto"
		},
		name: "tenso.sid",
		proxy: true,
		redis: {
			host: "127.0.0.1",
			port: 6379
		},
		rolling: true,
		resave: true,
		saveUninitialized: true,
		secret: "tensoABC",
		store: "memory"
	},
	silent: false,
	ssl: {
		cert: null,
		key: null,
		pfx: null
	},
	webroot: {
		root: "process.cwd()/www",
		static: "/assets",
		template: "template.html"
	}
}
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

A 'max byte' limit can be enforced on all routes that handle `PATCH`, `POST`, & `PUT` requests. The default limit is 20 KB (20,480 bytes).

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
