
var fs = require('fs');
var express = require('express');
var app = express.app();
var https = require('https');

var options = {
   key: fs.readFileSync('../certs/server.key'),
   cert: fs.readFileSync('../certs/server.cert')
};

https.createServer(options, app).listen(8443);