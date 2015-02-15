
var fs = require('fs');
var express = require('express');
var app = express.app();
var https = require('https');

var options = {
   key: fs.readFileSync('/var/keyserver/certs/server.key'),
   cert: fs.readFileSync('/var/keyserver/certs/server.cert')
};

https.createServer(options, app).listen(8443);