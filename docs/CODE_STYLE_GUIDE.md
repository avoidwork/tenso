# Tenso Code Style Guide

This document outlines the coding standards, naming conventions, architectural patterns, and customization approaches used in the Tenso web framework.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Documentation Standards](#documentation-standards)
- [Middleware Architecture & Data Flow](#middleware-architecture--data-flow)
- [Customization Patterns](#customization-patterns)
- [Code Organization](#code-organization)
- [Error Handling](#error-handling)
- [Security Guidelines](#security-guidelines)
- [Performance Best Practices](#performance-best-practices)

## Naming Conventions

### Functions and Methods
Use **camelCase** for all function and method names:

```javascript
// ✅ Good
export function hasBody(method) { }
export function canModify(arg) { }
export function rateLimit(req, fn) { }

// ❌ Bad
export function has_body(method) { }
export function CanModify(arg) { }
export function rate-limit(req, fn) { }
```

### Constants
Use **UPPER_CASE_SNAKE_CASE** for all constants:

```javascript
// ✅ Good
export const INT_200 = 200;
export const HEADER_CONTENT_TYPE = "content-type";
export const X_CSRF_TOKEN = "x-csrf-token";

// ❌ Bad
export const int200 = 200;
export const headerContentType = "content-type";
export const xCsrfToken = "x-csrf-token";
```

### Classes
Use **PascalCase** for class names:

```javascript
// ✅ Good
class Tenso extends Woodland { }
class MyCustomRenderer { }

// ❌ Bad
class tenso extends Woodland { }
class myCustomRenderer { }
```

### Files and Modules
Use **camelCase** or **kebab-case** for file names, preferring camelCase for utilities:

```javascript
// ✅ Good
src/utils/hasBody.js
src/middleware/asyncFlag.js
src/core/constants.js

// ❌ Bad
src/utils/has_body.js
src/middleware/AsyncFlag.js
src/core/Constants.js
```

### Variables and Properties
Use **camelCase** for variables and object properties:

```javascript
// ✅ Good
const requestBody = req.body;
const authConfig = server.auth;
const maxBytes = config.maxBytes;

// ❌ Bad
const request_body = req.body;
const AuthConfig = server.auth;
const max_bytes = config.maxBytes;
```

## Documentation Standards

### JSDoc Requirements
All functions and methods **must** include comprehensive JSDoc documentation:

```javascript
/**
 * Request body parsing middleware that uses registered parsers based on content type
 * Attempts to parse the request body and handles parsing errors
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function parse(req, res, next) {
    // Implementation
}
```

#### Required JSDoc Elements:
1. **Description**: Clear, concise explanation of what the function does
2. **@param**: Type, name, and description for each parameter
3. **@returns**: Return type and description
4. **@throws**: Document any exceptions thrown (when applicable)

### Class Documentation
Classes should include comprehensive documentation:

```javascript
/**
 * Tenso web framework class that extends Woodland
 * Provides HTTP REST API functionality with built-in middleware support
 * @class Tenso
 * @extends {Woodland}
 */
class Tenso extends Woodland {
    /**
     * Creates an instance of Tenso
     * @param {Object} [config=defaultConfig] - Configuration object for the Tenso instance
     */
    constructor(config = defaultConfig) {
        // Implementation
    }
}
```

## Middleware Architecture & Data Flow

### Middleware Pipeline Order
Tenso processes requests through a structured middleware pipeline in this order:

1. **Prometheus Metrics** (optional) - Request tracking and monitoring
2. **Exit Middleware** - Early termination for specific routes
3. **Payload Collection** - Gathering request body data
4. **Request Parsing** - Converting request body based on content type
5. **Authentication Pipeline**:
   - `bypass` - Determines if request should skip protection
   - `zuul` - Main protection coordinator
   - `guard` - Authentication enforcement
   - `redirect` - Authentication redirects
6. **Rate Limiting** - Request throttling
7. **CSRF Protection** - Cross-site request forgery prevention
8. **Route Handling** - Application-specific logic

### Middleware Function Signature
All middleware functions must follow this signature:

```javascript
/**
 * Middleware description
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function middlewareName(req, res, next) {
    // Middleware logic
    
    // Call next() to continue pipeline
    // Call next(error) to trigger error handling
    // Don't call next() to terminate pipeline
    next();
}
```

### Data Flow Patterns

#### Request Enhancement
Middleware can enhance the request object with additional properties:

```javascript
export function enhance(req, res, next) {
    // Add server reference
    req.server = this;
    
    // Add protection flags
    req.protect = false;
    req.unprotect = false;
    
    // Add parsed URL
    req.url = req.parsed.pathname;
    
    next();
}
```

#### Response Processing
The response pipeline processes data through these stages:

```javascript
// In tenso.js onSend handler
for (const fn of [serialize, hypermedia, this.final, this.render]) {
    body = fn(req, res, body);
}
```

1. **serialize** - Convert data to appropriate format
2. **hypermedia** - Add pagination and HATEOAS links
3. **final** - Custom post-processing hook
4. **render** - Format output for specific content types

## Customization Patterns

### Parser Registration
Parsers handle incoming request body parsing by content type:

```javascript
// Built-in parser registration
export const parsers = new Map([
    [HEADER_APPLICATION_JSON, json],
    [HEADER_APPLICATION_X_WWW_FORM_URLENCODED, xWwwFormURLEncoded],
    [HEADER_APPLICATION_JSONL, jsonl]
]);

// Custom parser registration
server.parser('application/custom', (body) => {
    // Parse the body and return structured data
    return parseCustomFormat(body);
});

// Parser function signature
/**
 * Custom parser for specific content type
 * @param {string} body - Raw request body string
 * @returns {*} Parsed data structure
 */
function customParser(body) {
    // Implementation
}
```

### Renderer Registration
Renderers transform data into specific output formats:

```javascript
// Built-in renderer registration
export const renderers = new Map([
    [HEADER_APPLICATION_JSON, json],
    [HEADER_APPLICATION_XML, xml],
    [HEADER_TEXT_CSV, csv]
]);

// Custom renderer registration
server.renderer('application/custom', customRenderer);

// Renderer function signature
/**
 * Custom renderer for specific content type
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} data - The data to render
 * @returns {string} Rendered output string
 */
function customRenderer(req, res, data) {
    // Transform data to custom format
    return formatAsCustom(data);
}
```

### Serializer Registration
Serializers structure the final response format:

```javascript
// Built-in serializer registration
export const serializers = new Map([
    [HEADER_APPLICATION_JSON, custom],
    [HEADER_TEXT_PLAIN, plain]
]);

// Custom serializer registration
server.serializer('application/custom', customSerializer);

// Serializer function signature
/**
 * Custom serializer for response structure
 * @param {*} data - The data to serialize
 * @param {Error|string|null} err - Error object or message
 * @param {number} [status=200] - HTTP status code
 * @param {boolean} [stack=false] - Include error stack trace
 * @returns {Object} Structured response object
 */
function customSerializer(data, err, status = 200, stack = false) {
    return {
        result: data,
        success: err === null,
        error: err,
        code: status
    };
}
```

## Code Organization

### File Structure
Organize code into logical modules:

```
src/
├── core/           # Core framework functionality
│   ├── config.js   # Default configuration
│   └── constants.js # Shared constants
├── middleware/     # Middleware functions
│   ├── auth.js     # Authentication middleware
│   ├── rate.js     # Rate limiting
│   └── parse.js    # Request parsing
├── parsers/        # Content type parsers
├── renderers/      # Output format renderers
├── serializers/    # Response serializers
├── utils/          # Utility functions
└── tenso.js        # Main framework class
```

### Import Organization
Organize imports in this order:

```javascript
// 1. Node.js built-in modules
import {readFileSync} from "node:fs";
import http from "node:http";

// 2. External dependencies
import {Woodland} from "woodland";
import {merge} from "tiny-merge";

// 3. Internal core modules
import {config as defaultConfig} from "./core/config.js";
import {AUTH, EMPTY} from "./core/constants.js";

// 4. Internal utilities
import {parsers} from "./utils/parsers.js";
import {hasBody} from "./utils/hasBody.js";

// 5. Internal middleware
import {payload} from "./middleware/payload.js";
import {parse} from "./middleware/parse.js";
```

## Error Handling

### Error Throwing
Use descriptive error messages and appropriate error types:

```javascript
// ✅ Good
if (req.body === undefined) {
    throw new Error("Request body is required for POST requests");
}

// ❌ Bad
if (req.body === undefined) {
    throw new Error("Invalid request");
}
```

### Middleware Error Handling
Handle errors appropriately in middleware:

```javascript
export function parse(req, res, next) {
    let valid = true;
    let exception;

    try {
        // Parsing logic
        req.body = parseBody(req.body);
    } catch (err) {
        valid = false;
        exception = err;
    }

    // Pass error to next middleware
    next(valid === false ? exception : void 0);
}
```

## Security Guidelines

### Input Validation
Always validate and sanitize input:

```javascript
// Validate content type
const type = req.headers?.[HEADER_CONTENT_TYPE]?.replace(/;?\s.*$/, EMPTY) ?? EMPTY;

// Validate byte limits
if (max > INT_0 && Buffer.byteLength(body) > max) {
    invalid = true;
    res.error(INT_413);
}
```

### CSRF Protection
Implement CSRF protection for state-changing operations:

```javascript
// Check if CSRF is required
req.csrf = this.canModify(req.method) === false && 
           this.canModify(req.allow) && 
           this.security.csrf === true;
```

### Rate Limiting
Implement appropriate rate limiting:

```javascript
export function rate(req, res, next) {
    const config = req.server.rate;
    
    if (config.enabled === false || req.unprotect) {
        next();
    } else {
        const results = req.server.rateLimit(req, config.override);
        const good = results.shift();
        
        if (good) {
            // Set rate limit headers
            for (const [idx, header] of rateHeaders.entries()) {
                res.header(header, results[idx]);
            }
            next();
        } else {
            res.header(RETRY_AFTER, config.reset);
            res.error(config.status || INT_429);
        }
    }
}
```

## Performance Best Practices

### Memory Management
- Use `Map` objects for frequently accessed collections
- Cache compiled regexes and reusable objects
- Clean up event listeners and timers

### Memoization
Cache expensive operations when possible:

```javascript
let memoized = false;
let cachedFn, cachedKey, cachedSecret;

export function csrfWrapper(req, res, next) {
    if (memoized === false) {
        // Expensive setup
        cachedKey = req.server.security.key;
        cachedSecret = req.server.security.secret;
        cachedFn = setupCSRF(cachedKey, cachedSecret);
        memoized = true;
    }
    
    // Use cached function
    cachedFn(req, res, next);
}
```

### Async Operations
Handle asynchronous operations properly:

```javascript
// Use async/await for clarity
async function processUpload(req, res) {
    try {
        const result = await uploadFile(req.body);
        res.json(result);
    } catch (error) {
        res.error(500, error);
    }
}

// Use streams for large data
req.on(DATA, data => {
    // Process chunks as they arrive
    processChunk(data);
});
```

### Testing Guidelines

#### Unit Tests
Write comprehensive unit tests for all functions:

```javascript
import assert from "node:assert";
import {hasBody} from "../../src/utils/hasBody.js";

describe("utils/hasBody", () => {
    it("should return true for POST requests", () => {
        assert.strictEqual(hasBody("POST"), true);
    });
    
    it("should return false for GET requests", () => {
        assert.strictEqual(hasBody("GET"), false);
    });
});
```

#### Integration Tests
Test middleware integration and data flow:

```javascript
describe("middleware integration", () => {
    it("should process request through full pipeline", async () => {
        const app = tenso();
        // Test complete request flow
    });
});
```

---

Following these guidelines ensures consistent, maintainable, and secure code that aligns with the Tenso framework's architecture and design principles. 