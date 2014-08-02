"use strict";

var tenso  = require( "./lib/tenso" ),
    config = require( __dirname + "/config.json" ),
    app;

app = tenso(config);
