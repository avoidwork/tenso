"use strict";

const http = require("http");

http.createServer((req, res) => {
	res.writeHead(200, {"content-type": "application/json; char-set=utf-8"});
	res.end(JSON.stringify("Hello World!"));
}).listen(8000);
