
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
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';

var redis = require('redis');

var redisClient = redis.createClient();

var data = {
   secrets: {}
};

function genKey() {
   var users = Object.keys(data.secrets);
   users.sort();
   log.info('genKey', data.keyName, users);
   for (var i = 0; i < users.length; i++) {
      for (var j = 0; j < users.length; j++) {
         if (j > i) {
            log.info('genKey', data.keyName, users[i], users[j]);
         }
      }
   }
}

redisClient.on('error', function (err) {
   log.error('error', err);
});

function handleError(res, error) {
   log.error('error', error, error.stack);
   res.status(500).send(error);
}

function handleGet(req, res) {
   try {
      throw new Error('unimplemented: ' + req.url);
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetGenKey(req, res) {
   try {
      data.keyName = req.params.name;
      data.custodianCount = parseInt(req.params.count);
      data.secrets = {};
      var reply = {
         message: 'ok',
         keyName: data.keyName,
         custodianCount: data.custodianCount
      };
      log.info('reply', reply);
      res.send(reply);
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetHelp(req, res) {
   try {
      res.set('Content-Type', "text/plain");
      fs.readFile('README.md', function (err, data) {
         if (data) {
            res.send(data);
         } else {
            res.send('no help');
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handlePostSecret(req, res) {
   try {
      data.secrets[req.params.user] = req.body;
      var reply = {
         message: 'ok',
         user: req.params.user,
         custodianCount: data.custodianCount,
         secretCount: Object.keys(data.secrets).length
      };
      log.info('reply', reply);
      res.send(reply);
      if (data.custodianCount === Object.keys(data.secrets).length) {
         genKey();
      }
   } catch (error) {
      handleError(res, error);
   }
}

function appLogger(req, res, next) {
   log.info('app', req.url);
   next();
}

function start(config) {
   log.info('config', config);
   app.use(appLogger);
   app.get('/', handleGetHelp);
   app.get('/help', handleGetHelp);
   app.get('/genkey/:name/:count', handleGetGenKey);
   app.post('/secret/:name/:user', handlePostSecret);
   var options = {
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert)
   };
   https.createServer(options, app).listen(8443);
}

start(require('/var/mobi/config/keyserver.json'));

