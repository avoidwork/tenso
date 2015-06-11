"use strict";

const CONFIG = require(__dirname + "/../config.json");
const VERSION = "{{VERSION}}";
const SERVER = "tenso/" + VERSION;

let keigai = require("keigai"),
	util = keigai.util,
	array = util.array,
	coerce = util.coerce,
	iterate = util.iterate,
	json = util.json,
	merge = util.merge,
	string = util.string,
	uuid = util.uuid,
	xml = util.xml,
	fs = require("fs"),
	path = require("path"),
	yaml = require("yamljs"),
	turtleio = require("turtle.io"),
	session = require("express-session"),
	cookie = require("cookie-parser"),
	lusca = require("lusca"),
	passport = require("passport"),
	BasicStrategy = require("passport-http").BasicStrategy,
	BearerStrategy = require("passport-http-bearer").Strategy,
	FacebookStrategy = require("passport-facebook").Strategy,
	GoogleStrategy = require("passport-google").Strategy,
	LinkedInStrategy = require("passport-linkedin").Strategy,
	LocalStrategy = require("passport-local").Strategy,
	OAuth2Strategy = require("passport-oauth2").Strategy,
	SAMLStrategy = require("passport-saml").Strategy,
	TwitterStrategy = require("passport-twitter").Strategy,
	RedisStore = require("connect-redis")(session);
