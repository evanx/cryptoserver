
var fs = require('fs');
var async = require('async');
var S = require('string');
var _ = require('underscore');
var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser')
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "keyserver"});

var redis = require('redis');

var redisClient = redis.createClient();

var data = {
   passwords: {}
};

redisClient.on('error', function (err) {
   console.error('error', err);
});

function handleGet(req, res) {
   try {
      throw new Error('unimplemented: ' + req.url);
   } catch (error) {
      console.error('error', error);
      res.status(500).send(error.message);
   }
}

function handleGetGenKey(req, res) {
   try {
      data.keyName = req.parms.name;
      data.custodianCount = req.params.count;
      data.passwords = {};
   } catch (error) {
      console.error('error', error);
      res.status(500).send(error.message + '\n');
   }
}

function handleGetHelp(req, res) {
   try {
      res.set('Content-Type', 'text/plain');
      fs.readFile('README.md', function (err, data) {
         if (data) {
            res.send(data);
         } else {
            res.send('no help');
         }
      });
   } catch (error) {
      console.error('error', error);
      res.status(500).send(error.message + '\n');
   }
}

function handlePostPassword(req, res) {
   try {
      throw new Error(['unimplemented', req.params.name, req.body]);
   } catch (error) {
      console.error('error', error);
      res.status(500).send(error.message + '\n');
   }
}

function start(config) {
   console.info('config', config);
   app.get('/', handleGetHelp);
   app.get('/help', handleGetHelp);
   app.get('/genkey/:name/:count', handleGetGenKey);
   app.post('/password/:user', handlePostPassword);
   var options = {
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert)
   };
   https.createServer(options, app).listen(8443);
}

start(require('/var/mobi/config/keyserver.json'));

