# Change Log

## 0.3.0
- Added rate limiting
- Reverted a change to the Grunt file, such that 'test' runs jshint & mocha tests

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