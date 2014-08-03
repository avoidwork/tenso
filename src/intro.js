( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/{{VERSION}}",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
	passport = require( "passport" ),
    util     = keigai.util,
    array    = util.array,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge;
