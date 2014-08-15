( function () {
"use strict";

var turtleio = require( "turtle.io" ),
    SERVER   = "tenso/{{VERSION}}",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    array    = util.array,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge,
    uuid     = util.uuid,
    session  = require( "express-session" ),
    cookie   = require( "cookie-parser" ),
    passport = require( "passport" ),
    BasicStrategy    = require( "passport-http" ).BasicStrategy,
    BearerStrategy   = require( "passport-http-bearer" ).Strategy,
    FacebookStrategy = require( "passport-facebook" ).Strategy,
    GoogleStrategy   = require( "passport-google" ).Strategy,
    LinkedInStrategy = require( "passport-linkedin" ).Strategy,
    TwitterStrategy  = require( "passport-twitter" ).Strategy,
	RedisStore       = require( "connect-redis" )( session );
