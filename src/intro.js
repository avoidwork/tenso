( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/{{VERSION}}",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    array    = util.array,
    string   = util.string,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge,
    passport = require( "passport" ),
    BearerStrategy = require( "passport-http-bearer" ).Strategy;
