
var fs = require('fs');
var async = require('async');
var S = require('string');
var _ = require('underscore');
var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser')
var concat = require('concat-stream');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "keyserver"});
var marked = require('marked');
var crypto = require('crypto');
var cryptoUtils = require('./cryptoUtils');
var commonUtils = require('./commonUtils');
var appUtils = require('./appUtils');
var GenerateKey = require('./GenerateKey');
var LoadKey = require('./LoadKey');

var redis = require('redis');

global.keyserver = exports;

exports.log = log;
exports.redisClient = redis.createClient();

exports.data = {
   secrets: {}
};

exports.redisClient.on('error', function (err) {
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

function handleGetKeyInfo(req, res) {
   try {
      exports.data.keyName = req.params.keyName;
      exports.data.redisKey = 'dek:' + exports.data.keyName;
      exports.redisClient.hkeys(exports.data.redisKey, function (err, reply) {
         var responseData = {
            keyName: exports.data.keyName,
            reqUrl: req.url
         };
         if (err) {
            responseData = {
               error: 'error: ' + err,
            };
            res.status(500);
         } else if (reply.length) {
            responseData.properties = reply;
         } else {
            responseData.error = 'empty';
            res.status(500);
         }
         log.info('reply', exports.data.redisKey, responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetGenKey(req, res) {
   try {
      exports.data.keyName = req.params.keyName;
      exports.data.redisKey = 'dek:' + exports.data.keyName;
      exports.data.custodianCount = parseInt(req.params.count);
      exports.data.command = 'genKey';
      exports.data.secrets = {};
      var responseData = {
         keyName: exports.data.keyName,
         custodianCount: exports.data.custodianCount,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(exports.data.redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
         if (err) {
            responseData.error = err,
                    res.status(500);
         } else if (Object.keys(reply).length) {
            responseData.error = 'already exists';
            responseData.data = reply;
            res.status(500);
         } else {
         }
         log.info('reply', responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetLoadKey(req, res) {
   try {
      exports.data.keyName = req.params.keyName;
      exports.data.redisKey = 'dek:' + exports.data.keyName;
      exports.data.secrets = {};
      var responseData = {
         keyName: exports.data.keyName,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(exports.data.redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
         if (err) {
            responseData.error = err,
                    res.status(500);
         } else if (!Object.keys(reply).length) {
            responseData.error = 'not found';
            res.status(500);
         } else {
            exports.data.command = 'loadKey';
         }
         log.info('reply', responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetHelp(req, res) {
   try {
      res.set('Content-Type', "text/html");
      fs.readFile('README.md', function (err, data) {
         if (data) {
            res.send(marked(data.toString()));
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
      log.info('secret', req.peerCN);
      exports.data.keyName = req.params.keyName;
      exports.data.redisKey = 'dek:' + exports.data.keyName;
      exports.data.secrets[req.peerCN] = req.body;
      var responseData = {
         keyName: exports.data.keyName,
         user: req.peerCN,
         custodianCount: exports.data.custodianCount,
         secretCount: Object.keys(exports.data.secrets).length,
         reqUrl: req.url
      };
      log.info('reply', responseData);
      res.send(responseData);
      if (exports.data.command === 'genKey') {
         if (Object.keys(exports.data.secrets).length === exports.data.custodianCount) {
            new GenerateKey(exports).perform(function (err) {
               if (err) {
                  log.error('GenerateKey error', err);
               } else {
                  log.info('GenerateKey ok', exports.data.keyName);
               }
            });
         }
      } else if (exports.data.command === 'genKey') {
         if (Object.keys(exports.data.secrets).length === 2) {
            new LoadKey(exports).perform(function (err) {
               if (err) {
                  log.error('LoadKey error', err);
               } else {
                  log.info('LoadKey ok', exports.data.keyName);
               }
            })
         }
      }
   } catch (error) {
      handleError(res, error);
   }
}

function appLogger(req, res, next) {
   log.info('app', req.url);
   next();
}

function authorise(req, res, next) {
   log.info('authorise', req.url, req.peerCN);
   if (req.url === '/help') {
      next();
   } else if (!req.peerCN) {
      throw new Error('not authorized');
   } else {
      next();
   }
}

function authenticate(req, res, next) {
   if (!res.socket.authorized) {
      if (req.url === '/help') {
         next();
      } else {
         res.redirect('/help');
      }
   } else {
      var cert = req.socket.getPeerCertificate();
      req.peerCN = cert.subject.CN;
      log.info('authenticate', req.url, cert.subject.CN, cert.issuer);
      next();
   }
}

function dechunk(req, res, next) {
   req.pipe(concat(function (data) {
      req.body = data;
      next();
   }));
}

function start(config) {
   log.info('config', config);
   app.use(appLogger);
   app.use(authenticate);
   app.use(authorise);
   app.get('/help', handleGetHelp);
   app.get('/genkey/:keyName/:count', handleGetGenKey);
   app.get('/key/:keyName', handleGetKeyInfo);
   app.get('/load/:keyName', handleGetLoadKey);
   app.use(dechunk);
   app.post('/secret/:keyName', handlePostSecret);
   app.get('/', handleGetHelp);
   var options = {
      ca: fs.readFileSync(config.ca),
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert),
      requestCert: true
   };
   https.createServer(options, app).listen(config.port);
}

start({
   port: process.env.APP_PORT,
   key: process.env.SERVER_KEY,
   cert: process.env.SERVER_CERT,
   ca: process.env.CA_CERT
});

