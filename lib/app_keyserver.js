
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
var crypto = require('crypto');
var cryptoUtils = require('./cryptoUtils');
var commonUtils = require('./commonUtils');
var appUtils = require('./appUtils');
var GenerateKey = require('./GenerateKey');

var redis = require('redis');

global.keyserver = exports;

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
         var replyObject = {
            keyName: exports.data.keyName
         };
         if (err) {
            replyObject = {
               error: 'error: ' + err,
            };
            res.status(500);
         } else if (reply.length) {
            replyObject.properties = reply;
         } else {
            replyObject.error = 'empty';
            res.status(500);
         }
         log.info('reply', exports.data.redisKey, replyObject);
         res.json(replyObject);
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
      exports.data.secrets = {};
      var replyObject = {
         keyName: exports.data.keyName,
         custodianCount: exports.data.custodianCount
      };
      exports.redisClient.hkeys(exports.data.redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
         if (err) {
            replyObject.error = err,
                    res.status(500);
         } else if (Object.keys(reply).length) {
            replyObject.error = 'already exists';
            replyObject.data = reply;
            res.status(500);
         } else {
         }
         log.info('reply', replyObject);
         res.json(replyObject);
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
      var replyObject = {
         keyName: exports.data.keyName
      };
      exports.redisClient.hkeys(exports.data.redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
         if (err) {
            replyObject.error = err,
                    res.status(500);
         } else if (!Object.keys(reply).length) {
            replyObject.error = 'not found';
            res.status(500);
         } else {
            new LoadKey(exports.data).perform(function (err) {
               if (err) {
                  reply.error = err;
               } else {
               }
            })
         }
         log.info('reply', replyObject);
         res.json(replyObject);
      });
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
      log.info('secret', req.peerCN);
      exports.data.keyName = req.params.keyName;
      exports.data.redisKey = 'dek:' + exports.data.keyName;
      exports.data.secrets[req.peerCN] = req.body;
      var reply = {
         keyName: exports.data.keyName,
         user: req.peerCN,
         custodianCount: exports.data.custodianCount,
         secretCount: Object.keys(exports.data.secrets).length
      };
      log.info('reply', reply);
      res.send(reply);
      if (exports.data.custodianCount === Object.keys(exports.data.secrets).length) {
         new GenerateKey(exports.data).perform(function (err) {
            if (err) {
               reply.error = err;
            } else {
            }
         })
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

function start(config) {
   log.info('config', config);
   app.use(appLogger);
   app.use(authenticate);
   app.use(authorise);
   app.get('/help', handleGetHelp);
   app.get('/genkey/:keyName/:count', handleGetGenKey);
   app.get('/key/:keyName', handleGetKeyInfo);
   app.get('/load/:keyName', handleGetLoadKey);
   app.use(function (req, res, next) {
      req.pipe(concat(function (data) {
         req.body = data;
         next();
      }));
   });
   app.post('/secret/:keyName', handlePostSecret);
   app.get('/', handleGetHelp);
   var options = {
      ca: fs.readFileSync(config.ca),
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert),
      requestCert: true
   };
   https.createServer(options, app).listen(8443);
}

start(require('/var/mobi/config/keyserver.json'));

