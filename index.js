
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
      throw new Error('unimplemented: ' + req.params.name);
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
   exports.config = config;
   console.log('config', config);
   app.get(config.location, handleGet);
   app.get(config.location + 'genkey/:count/:name', handleGetGenKey);
   app.post(config.location + 'password/:user/:name', handlePostPassword);
   app.listen(config.port);
}

var config = {
   port: 8888,
   location: "/app/"
};

start(config);
