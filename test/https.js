
var fs = require('fs');
var express = require('express');
var app = express.app();
var https = require('https');

var options = {
   key: fs.readFileSync('/var/mobi/certs/keyserver/server.key'),
   cert: fs.readFileSync('/var/mobi/certs/keyserver/server.cert')
};

https.createServer(options, app).listen(8443);