
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
   passwords: {}
};

function genKey() {
   var users = Object.keys(data.passwords);
   users.sort();
   console.info('genKey', data.keyName, users);
   for (var i = 0; i < users.length; i++) {
      for (var j = 0; j < users.length; j++) {
         if (j > i) {
            console.info('genKey', data.keyName, users[i], users[j]);            
         }
      }      
   }
}

redisClient.on('error', function (err) {
   console.error('error', err);
});

function handleError(res, error) {
   console.error('error', error, error.stack);
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
      data.passwords = {};
      var reply = {
         message: 'ok',
         keyName: data.keyName,
         custodianCount: data.custodianCount
      };
      console.info('reply', reply);
      res.send(reply);
   } catch (error) {
      handleError(res, error);
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
      handleError(res, error);
   }
}

function handlePostPassword(req, res) {
   try {
      data.passwords[req.params.user] = req.body;
      var reply = {
         message: 'ok',
         user: req.params.user,
         custodianCount: data.custodianCount,
         passwordCount: Object.keys(data.passwords).length
      };
      console.info('reply', reply);
      res.send(reply);
      if (data.custodianCount === Object.keys(data.passwords).length) {
         genKey();
      }
   } catch (error) {
      handleError(res, error);
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
   app.use(require('express-bunyan-logger')());
   https.createServer(options, app).listen(8443);
}

start(require('/var/mobi/config/keyserver.json'));

