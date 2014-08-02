( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/{{VERSION}}",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge;
