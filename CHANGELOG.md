# Change Log

## 0.9.9
- Updated `turtle.io` to gain automatic handling of `CORS` requests from a browser

## 0.9.8
- Refactored `Local Auth` to not redirect `CORS` requests from a browser, and return a success message

## 0.9.7
- Updated dependencies

## 0.9.6
- Updated dependencies

## 0.9.5
- Fixed `hypermedia()` when URI has a trailing slash and is a collection, added a test

## 0.9.4
- Changed `/logout` such that it works without being a protected route

## 0.9.3
- Made `hypermedia()` smartr by not mutating the result when it's an Array of URIs, for obvious data modeling issues!

## 0.9.2
- Upgraded deps, gained better CSV decoding

## 0.9.1
- Upgraded deps

## 0.9.0
- Made `hypermedia()` smartr by knowing when a key is an item or a related URI, & to not remove `link` keys for obvious data modeling issues!

## 0.8.3
- Fixed `hypermedia()` when dealing with collections: `Array` of `Objects` e.g. a record set, added a test

## 0.8.2
- Updated deps

## 0.8.1
- Fixed an oversight in two conditionals within `auth()`

## 0.8.0
- Refactored `auth()` & created 'by config' end points for `Basic` & `Bearer` under `/auth`, such that they don't collide with stateful strategies
- Updated `hypermedia()` to add a `collection` link for non `Array/Object` representations & to set a `rel` of `item` for `Array` based links, updated tests

## 0.7.2
- Enabled `auth.linkedin.scope`; missed it
- Removed double `blacklist()` of middleware within each authentication strategy

## 0.7.1
- Modified `parse()` middleware to handle `application/json` content-type request bodies

## 0.7.0
- Added `OAuth2`, & `SAML` authentication
- Refactored `Local Auth` to use passport
- Refactored `auth()` to mix stateless & stateful auth strategies the same time
- Added `parse()` middleware via `bootstrap()` to coerce `req.body`
- Created `auth.redirect` configuration option for customizing where an end user is redirected to upon successful (stateful) authentication, default is `/`

## 0.6.1
- Upgrading turtle.io to 3.0.15 for etag middleware fix (out of order execution negated it)

## 0.6.0
- Moved `mediator()` middleware out of `auth()` and into `bootstrap()`
- Fixed redundant variable initialization in `Tenso.prototype.rate()`
- Added CSS map file
- Refactored `auth()` to be DRYer, and enabled support for multiple social authentication strategies

## 0.5.2
- Updated `hypermedia()` to apply the same logic to Entity reps, updated tests

## 0.5.1
- Changed `data.result` to `null` if all content is lifted into `data.link`, updated tests

## 0.5.0
- URIs (relative or absolute) in `data.result[]` are treated as hypermedia and lifted in `data.link`, updated tests
- Added an `Allow` header assertion to the permission test
- Pagination is only decorated if the result exceeds the page size

## 0.4.4
- Fixed blacklisting of middleware within `auth()`, & `bootstrap()`
- Fixed `keymaster()` for `HEAD` & `OPTIONS` requests
- Upgraded turtle.io to 3.0.14
- Set session cookie flag to avoid warning messages during tests

## 0.4.3
- Upgrading turtle.io to 3.0.13 & blacklisting all authentication middleware

## 0.4.2
- Added lusca for security, enabling CSRF by default
- Added grunt-nsp-package for module vulnerability scanning during `package` task

## 0.4.1
- Fixed an edge case in `hypermedia()` such that the `URI` is not lifted into the `links` Array via automagic, updated test
- Updated `hypermedia()` to add a `collection` link for an `Entity` representation _[RFC6573]_, updated test
- Cached `RegExp` invariants

## 0.4.0
- Added `Facebook`, `Google`, `LinkedIn`, & `Twitter` authentication via `passport`
- Fixed the `RegExp` used to retrieve the rate limit id from the `authorization` header
- Moved authentication gateway middleware into `zuul()`, & fixed what it tests
- Fixed `prepare()` by cloning the response body
- Changed default host to `127.0.0.1`
- Decorating `req.protect` & `req.protectAsync` from `zuul()` and various authentication strategies
- Upgrading turtle.io to 3.0.10 for middleware pipeline & misc fixes to make it play nice with passport.js
- Added support for Redis as a session store

## 0.3.6
- Upgraded turtle.io to 2.3.0
- Refactored `Basic Auth` to use `passport`

## 0.3.5
- Fixed tests

## 0.3.4
- Updating `config.json` with more options of `turtle.io`
- Upgrading turtle.io to gain `accept: application/json; indent=n` driven pretty JSON

## 0.3.3
- Correcting the wildcard handling (forgot a case)

## 0.3.2
- Disabled compression when SSL is enabled
- Fixed wildcards in `protect` Array under `auth`

## 0.3.1
- Added `maxBytes` configuration flag to enforce limits on `PATCH`, `POST`, & `PUT` requests, added a test
- Set `maxBytes` to a default of 1 MB
- Upgraded turtle.io to 2.2.4

## 0.3.0
- Added rate limiting
- Reverted a change to the Grunt file, such that 'test' runs jshint & mocha tests
- Updating turtle.io to 2.2.3 for a middleware fix
- Creating `Tenso.rates` to store rate limiting data
- Creating `Tenso.rates()` to be called from `rate()` middleware

## 0.2.0
- Created `Tenso.redirect(req, res, uri)`, & `Tenso.error(req, res, status, arg)`
- Added `local` authentication, which is controlled by config
- Added `express-session` as a dependency, and enabled sessions
- Updated turtle.io to gain `res.redirect()`

## 0.1.1
- Decorating `hostname` on Tenso instance
- Removed temp function that made it into a release
- Refactored tests to use multiple servers
- Added tests for authentications

## 0.1.0
- Added OAuth2 Bearer Token authentication, tokens are expected to be updated 'by reference' (tbd)
- Updated keigai to 0.6.1 to fix a string escape function
- Updated turtle.io to 2.1.18 to fix middleware problem

## 0.0.10
- Fixing `hypermedia()` by ensuring no `link` Objects when a collection is empty, added a test

## 0.0.9
- Fixing `hypermedia()` URI reconstruction by encoding the query string values, added a test

## 0.0.8
- Fixing `hypermedia()` to deal with an out of bounds `page`, added a test

## 0.0.7
- Added hippie functional tests
- Updated turtle.io dependency to fix a permission error

## 0.0.6
- Changing the default hypermedia link rel to `related` for a more generic implied relationship

## 0.0.5
- Implementing hypermedia & automagic pagination

## 0.0.4
- Implementing a clean Basic Auth (by config)

## 0.0.3
- Updated `turtle.io` to 2.1.9 to gain customization of JSON formatting
- Updated routing such that handlers execute with the context of the Tensō instance
- Created `Tenso.prototype.respond()` to provide a very simple method for creating a response from custom routes
- Updated README with more content
- Updated default HTML page when no routes are loaded

## 0.0.2
- Initial implementation of routing via external module

## 0.0.1
- Empty module, reserving the name