
var fs = require('fs');
var async = require('async');
var S = require('string');
var _ = require('underscore');
var express = require('express');
var app = express();
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

function start(port) {
   app.get('/', handleGetHelp);
   app.get('/help', handleGetHelp);
   app.get('/genkey/:name/:count', handleGetGenKey);
   app.post('/password/:user', handlePostPassword);
   app.listen(port);
}

if (process.env.KEYSERVER_PORT) {
   start(process.env.KEYSERVER_PORT);
} else {
   console.error("KEYSERVER_PORT is not set");
   process.exit(1);
}
