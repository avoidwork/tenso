# Tenso

Tenso is an HTTP REST API framework, that will handle the serialization & creation of hypermedia links; all you have to do is give it `Arrays` or `Objects`.

## Example
Creating an API with Tenso can be this simple:

```javascript
import {tenso} from "tenso";

export const app = tenso();

app.get("/", "Hello, World!");
app.start();
```

### Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server.

You can use `res` to `res.send(body[, status, headers])`, `res.redirect(url)`, or `res.error(status[, Error])`. 

The following example will create GET routes that will return an `Array` at `/`, an `Error` at `/reports/tps`, & a version 4 UUID at `/uuid`.

As of 10.3.0 you can specify `always` as a method to run middleware before authorization middleware, which will skip `always` middleware registered after it (via instance methods).

#### Example

##### Routes

```javascript
import {randomUUID as uuid} from "crypto";

export const initRoutes = {
	"get": {
		"/": ["reports", "uuid"],
		"/reports": ["tps"],
		"/reports/tps": (req, res) => res.error(785, Error("TPS Cover Sheet not attached")),
		"/uuid": (req, res) => res.send(uuid(), 200, {"cache-control": "no-cache"})
	}
};
```

##### Server

```javascript
import {tenso} from "tenso";
import {initRoutes} from "./routes";

export const app = tenso({initRoutes});

app.start();
```

#### Protected Routes
Protected routes are routes that require authorization for access, and will redirect to authentication end points if needed.

#### Unprotected Routes
Unprotected routes are routes that do not require authorization for access, and will exit the authorization pipeline early to avoid rate limiting, csrf tokens, & other security measures. These routes are the DMZ of your API! _You_ **must** secure these end points with alternative methods if accepting input!

#### Reserved Route
The `/assets/*` route is reserved for the HTML browsable interface assets; please do not try to reuse this for data.

### Request Helpers
Tenso decorates `req` with "helpers" such as `req.allow`, `req.csrf`, `req.ip`, `req.parsed`, & `req.private`. `PATCH`, `PUT`, & `POST` payloads are available as `req.body`. Sessions are available as `req.session` when using `local` authentication.

Tenso decorates `res` with "helpers" such as `res.send()`, `res.status()`, & `res.json()`.

## Extensibility
Tenso is extensible, and can be customized with custom parsers, renderers, & serializers.

### Parsers
Custom parsers can be registered with `server.parser('mimetype', fn);` or directly on `server.parsers`. The parameters for a parser are `(arg)`.

Tenso has parsers for:

- `application/json`
- `application/x-www-form-urlencoded`
- `application/jsonl`
- `application/json-lines`
- `text/json-lines`

### Renderers
Custom renderers can be registered with `server.renderer('mimetype', fn);`. The parameters for a renderer are `(req, res, arg)`.

Tenso has renderers for:

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
Custom renderers can be registered with `server.serializer('mimetype', fn);`. The parameters for a serializer are `(arg, err, status = 200, stack = false)`.

Tenso has two default serializers which can be overridden:

- `plain` for plain text responses
- `custom` for standard response shape

## Responses
Responses will have a standard shape, and will be utf-8 by default. The result will be in `data`. Hypermedia (pagination & links) will be in `links:[ {"uri": "...", "rel": "..."}, ...]`, & also in the `Link` HTTP header.

Page size can be specified via the `page_size` parameter, e.g. `?page_size=25`.

Sort order can be specified via then `order-by` which accepts `[field ]asc|desc` & can be combined like an SQL 'ORDER BY', e.g. `?order_by=desc` or `?order_by=lastName%20asc&order_by=firstName%20asc&order_by=age%20desc`

## REST / Hypermedia
Hypermedia is a prerequisite of REST, and is best described by the [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tenso will automagically paginate Arrays of results, or parse Entity representations for keys that imply
relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered
hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

Tenso will bend the rules of REST when using authentication strategies provided by passport.js, or CSRF if is enabled, because they rely on a session. Session storage is in memory, or Redis. You have the option of a stateless or stateful API.

Hypermedia processing of the response body can be disabled as of `10.2.0`, by setting `req.hypermedia = false` and/or `req.hypermediaHeader` via middleware.

## Configuration
This is the default configuration for Tenso, without authentication or SSL. This would be ideal for development, but not production! Enabling SSL is as easy as providing file paths for the two keys.

Everything is optional! You can provide as much, or as little configuration as you like.

```
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
			audience: EMPTY,
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
	host: "0.0.0.0",
	index: [],
	initRoutes: {},
	jsonIndent: 0,
	logging: {
		enabled: true,
		format: "%h %l %u %t \"%r\" %>s %b",
		level: "debug",
		stack: true
	},
	maxBytes: 0,
	mimeType: "application/json",
	origins: ["*"],
	port: 8000,
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

## Authentication
The `protect` Array is the endpoints that will require authentication. The `redirect` String is the end point users will be redirected to upon successfully authenticating, the default is `/`.

Sessions are used for non `Basic` or `Bearer Token` authentication, and will have `/login`, `/logout`, & custom routes. Redis is supported for session storage.

Multiple authentication strategies can be enabled at once.

Authentication attempts have a random delay to deal with "timing attacks"; always rate limit in production environment!

### Basic Auth
```
{
	"auth": {
		"basic": {
			"enabled": true,
			"list": ["username:password", ...],
		},
		"protect": ["/"]
	}
}
```

### JSON Web Token
JSON Web Token (JWT) authentication is stateless and does not have an entry point. The `auth(token, callback)` function must verify `token.sub`, and must execute `callback(err, user)`.

This authentication strategy relies on out-of-band information for the `secret`, and other optional token attributes.

```
{
	"auth": {
		"jwt": {
			"enabled": true,
			"auth": function (token, cb) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"algorithms": [], /* Optional signing algorithms, defaults to ["HS256", "HS384", "HS512"] */
			"audience": "", /* Optional, used to verify `aud` */
			"issuer: "", /* Optional, used to verify `iss` */
			"ignoreExpiration": false, /* Optional, set to `true` to ignore expired tokens */
			"scheme": "Bearer", /* Optional, set to specify the `Authorization` scheme */
			"secretOrKey": ""
		}
		"protect": ["/private"]
	}
}
```

### OAuth2
OAuth2 authentication will create `/auth`, `/auth/oauth2`, & `/auth/oauth2/callback` routes. `auth(accessToken, refreshToken, profile, callback)` must execute `callback(err, user)`.
 
```
{
	"auth": {
		"oauth2": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"auth_url": "", /* Authorization URL */
			"token_url": "", /* Token URL */
			"client_id": "", /* Get this from authorization server */
			"client_secret": "" /* Get this from authorization server */
		},
		"protect": ["/private"]
	}
}
```

### Oauth2 Bearer Token
```
{
	"auth": {
		"bearer": {
			"enabled": true,
			"tokens": ["abc", ...]
		},
		"protect": ["/"]
	}
}
```

### SAML
SAML authentication will create `/auth`, `/auth/saml`, & `/auth/saml/callback` routes. `auth(profile, callback)` must execute `callback(err, user)`.

Tenso uses [passport-saml](https://github.com/bergie/passport-saml), for configuration options please visit it's homepage.
 
```
{
	"auth": {
		"saml": {
			"enabled": true,
			...
		},
		"protect": ["/private"]
	}
}
```

## Sessions
Sessions can use a memory (default) or redis store. Memory will limit your sessions to a single server instance, while redis will allow you to share sessions across a cluster of processes, or machines. To use redis, set the `store` property to "redis".

If the session `secret` is not provided, a version 4 `UUID` will be used.

```
{
	"session" : {
		cookie: {
			httpOnly: true,
			path: "/",
			sameSite: true,
			secure: false
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
	}
}
```


## Security
Tenso uses [lusca](https://github.com/krakenjs/lusca#api) for security as a middleware. Please see it's documentation for how to configure it; each method & argument is a key:value pair for `security`.

```
{
	"security": { ... }
}
```

## Rate Limiting
Rate limiting is controlled by configuration, and is disabled by default. Rate limiting is based on `token`, `session`, or `ip`, depending upon authentication method.

Rate limiting can be overridden by providing an `override` function that takes `req` & `rate`, and must return (a modified) `rate`.

```
{
	"rate": {
		"enabled": true,
		"limit": 450, /* Maximum requests allowed before `reset` */
		"reset": 900, /* TTL in seconds */
		"status": 429, /* Optional HTTP status */
		"message": "Too many requests",  /* Optional error message */
		"override": function ( req, rate ) { ... } /* Override the default rate limiting */
	}
}
```

## Limiting upload size
A 'max byte' limit can be enforced on all routes that handle `PATCH`, `POST`, & `PUT` requests. The default limit is 20 KB (20480 B).

```
{
	"maxBytes": 5242880
}
```

## Logging
Standard log levels are supported, and are emitted to `stdout` & `stderr`. Stack traces can be enabled.

```
{
	"logging": {
		"level": "warn",
		"enabled": true,
		"stack": true
	}
}
```

## HTML Renderer
The HTML template can be overridden with a custom HTML document.

Dark mode is supported! The `dark` class will be added to the `body` tag if the user's browser is in dark mode.

```
webroot: {
    root: "full path",
    static: "folder to serve static assets",
    template: "html template"
}
```

## Serving files
Custom file routes can be created like this:

```
app.files("/folder", "/full/path/to/parent");
```

## EventSource streams
Create & cache an `EventSource` stream to send messages to a Client. See [tiny-eventsource](https://github.com/avoidwork/tiny-eventsource) for configuration options:

```
const streams = new Map();

...

"/stream": (req, res) => {
 const id = req.user.userId;

 if (streams.has(id) === false) {
   streams.set(id, req.server.eventsource({ms: 3e4), "initialized");
 }

 streams.get(id).init(req, res);
}

...

// Send data to Clients
streams.get(id).send({...});
```

## Testing

Tenso has ~80% code coverage with its tests. Test coverage will be added in the future.

```console
-----------|---------|----------|---------|---------|-------------------------------------------------------------------------------------------------------------------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------|---------|----------|---------|---------|-------------------------------------------------------------------------------------------------------------------------------
All files  |   78.15 |    54.93 |   68.75 |   78.58 |                                                                                                                               
 tenso.cjs |   78.15 |    54.93 |   68.75 |   78.58 | ...85,1094,1102,1104,1115-1118,1139,1149-1175,1196-1200,1243-1251,1297-1298,1325-1365,1370,1398-1406,1412-1413,1425,1455-1456 
-----------|---------|----------|---------|---------|-------------------------------------------------------------------------------------------------------------------------------
```

## Benchmark

1. Clone repository from [GitHub](https://github.com/avoidwork/tenso).
1. Install dependencies with `npm` or `yarn`.
1. Execute `benchmark` script with `npm` or `yarn`.

## License
Copyright (c) 2024 Jason Mulligan

Licensed under the BSD-3-Clause license.
