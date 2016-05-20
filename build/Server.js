'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.end = exports.start = undefined;

var _bluebird = require('bluebird');

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var start = exports.start = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee() {
      var env, options;
      return regeneratorRuntime.wrap(function _callee$(_context) {
         while (1) {
            switch (_context.prev = _context.next) {
               case 0:
                  env = process.env;

                  validateEnv(env);
                  exports.secretTimeoutSeconds = 120;
                  if (env.Server_secretTimeoutSeconds) {
                     exports.secretTimeoutSeconds = parseInt(env.Server_secretTimeoutSeconds);
                  }
                  keySecretsStore.init({ secretTimeoutSeconds: exports.secretTimeoutSeconds });
                  exports.monitorIntervalSeconds = 60;
                  if (env.Server_monitorIntervalSeconds) {
                     exports.monitorIntervalSeconds = parseInt(env.Server_monitorIntervalSeconds);
                  }
                  options = {
                     ca: fs.readFileSync(env.Server_caCert),
                     key: fs.readFileSync(env.Server_serverKey),
                     cert: fs.readFileSync(env.Server_serverCert),
                     requestCert: true
                  };

                  app.use(appLogger);
                  app.use(authenticate);
                  app.use(authorise);
                  app.get('/help', handleGetHelp);
                  app.get('/genkey/:keyName/:count', handleGetGenKey);
                  app.get('/key/:keyName', handleGetKeyInfo);
                  app.get('/load/:keyName', handleGetLoadKey);
                  app.use(dechunk);
                  app.post('/secret/:keyName', handlePostSecret);
                  app.post('/encrypt/:keyName', handlePostEncrypt);
                  exports.server = https.createServer(options, app).listen(env.Server_port);
                  logger.info('start', env.Server_port, env.NODE_ENV);
                  exports.intervalId = setInterval(monitor, exports.monitorIntervalSeconds * 1000);
                  return _context.abrupt('return', exports);

               case 22:
               case 'end':
                  return _context.stop();
            }
         }
      }, _callee, this);
   }));
   return function start() {
      return ref.apply(this, arguments);
   };
}();

var end = exports.end = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
         while (1) {
            switch (_context2.prev = _context2.next) {
               case 0:
                  if (exports.server) {
                     server.close();
                  }
                  if (exports.intervalId) {
                     clearInterval(exports.intervalId);
                  }

               case 2:
               case 'end':
                  return _context2.stop();
            }
         }
      }, _callee2, this);
   }));
   return function end() {
      return ref.apply(this, arguments);
   };
}();

var fs = require('fs');
var async = require('async');
var lodash = require('lodash');
var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser');
var concat = require('concat-stream');
var bunyan = require('bunyan');
var marked = require('marked');
var crypto = require('crypto');

var Crypto = require('./Crypto');
var Common = require('./Common');
var genKey = require('./genKey');
var loadKey = require('./loadKey');
var keySecretsStore = require('./keySecretsStore');
var keyStore = require('./keyStore');
var encryptHandler = require('./encryptHandler');

var redis = require('redis');

global.cryptoserver = exports;

exports.logger = logger;
exports.redisClient = redis.createClient();

exports.redisClient.on('error', function (err) {
   logger.error('error', err);
});

function dechunk(req, res, next) {
   req.pipe(concat(function (content) {
      req.body = content;
      next();
   }));
}

function appLogger(req, res, next) {
   logger.info('app', req.url);
   next();
}

function authorise(req, res, next) {
   logger.info('authorise', req.url, req.peerCN);
   if (req.url === '/help') {
      next();
   } else if (!req.peerCN) {
      throw { message: 'not authorized' };
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
      logger.info('authenticate', req.url, cert.subject.CN, cert.issuer);
      next();
   }
}

function monitor() {
   logger.debug('monitor');
   keySecretsStore.monitor();
}

function handleError(res, error) {
   logger.error('error', error);
   if (error instanceof Error) {
      logger.error('error stack', error.stack);
   }
   res.status(500).send(error);
}

function handleGet(req, res) {
   try {
      throw { message: 'unimplemented: ' + req.url };
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetKeyInfo(req, res) {
   try {
      (function () {
         var user = req.peerCN;
         var keyName = req.params.keyName;
         var redisKey = 'dek:' + keyName;
         exports.redisClient.hkeys(redisKey, function (err, reply) {
            var responseData = {
               keyName: keyName,
               reqUrl: req.url
            };
            if (err) {
               responseData = {
                  error: 'error: ' + err
               };
               res.status(500);
            } else if (reply.length) {
               responseData.properties = reply;
            } else {
               responseData.error = 'empty';
               res.status(500);
            }
            logger.info('reply', redisKey, responseData);
            res.json(responseData);
         });
      })();
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetGenKey(req, res) {
   try {
      (function () {
         var user = req.peerCN;
         var keyName = req.params.keyName;
         var redisKey = 'dek:' + keyName;
         var custodianCount = parseInt(req.params.count);
         if (custodianCount < 2 || custodianCount > 5) {
            throw { message: 'invalid custodian count' };
         }
         var responseData = {
            keyName: keyName,
            custodianCount: custodianCount,
            reqUrl: req.url
         };
         exports.redisClient.hkeys(redisKey, function (err, reply) {
            logger.info('hkeys', typeof reply === 'undefined' ? 'undefined' : _typeof(reply), Array.isArray(reply));
            if (err) {
               responseData.error = err;
               res.status(500);
            } else if (Object.keys(reply).length) {
               responseData.error = 'already exists';
               responseData.data = reply;
               res.status(500);
            } else {
               keySecretsStore.put(user, keyName, 'genKey', custodianCount);
            }
            logger.info('reply', responseData);
            res.json(responseData);
         });
      })();
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetLoadKey(req, res) {
   try {
      (function () {
         var user = req.peerCN;
         var keyName = req.params.keyName;
         var redisKey = 'dek:' + keyName;
         var responseData = {
            keyName: keyName,
            reqUrl: req.url
         };
         exports.redisClient.hkeys(redisKey, function (err, reply) {
            logger.info('hkeys', typeof reply === 'undefined' ? 'undefined' : _typeof(reply), Array.isArray(reply));
            if (err) {
               responseData.error = err;
               res.status(500);
            } else if (!Object.keys(reply).length) {
               responseData.error = 'not found';
               res.status(500);
            } else {
               keySecretsStore.put(user, keyName, 'loadKey');
            }
            logger.info('reply', responseData);
            res.json(responseData);
         });
      })();
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetHelp(req, res) {
   try {
      res.set('Content-Type', "text/html");
      fs.readFile('README.md', function (err, content) {
         if (content) {
            res.send(marked(content.toString()));
         } else {
            res.send('no help');
         }
      });
   } catch (error) {
      handleError(res, error);
   }
}

function validateSecretComplexity(secret) {
   return secret.length >= 12 && /[A-Z]/.test(secret) && /[a-z]/.test(secret) && /\d/.test(secret) && /\W/.test(secret);
}

function performGenKey(user, keyName, keySecrets) {
   genKey(exports, keySecrets, function (err) {
      if (err) {
         logger.error('genKey error', err);
      } else {
         logger.info('genKey ok', keyName);
         keySecretsStore.clear(user, keyName);
      }
   });
}

function performLoadKey(user, keyName, keySecrets) {
   loadKey(exports, keySecrets, function (err, dek) {
      if (err) {
         logger.error('loadKey error', err);
      } else {
         logger.info('loadKey ok', keyName, dek.length);
         keySecretsStore.clear(user, keyName);
         keyStore.put(user, keyName, dek);
      }
   });
}

function handlePostSecret(req, res) {
   try {
      var user = req.peerCN;
      var keyName = req.params.keyName;
      var secret = req.body;
      var command = 'genKey'; // TODO
      logger.info('receive secret', user);
      if (process.env.NODE_ENV === 'production') {
         if (!validateSecretComplexity(secret)) {
            if (command === 'genKey') {
               throw { message: 'insufficient complexity' };
            }
         }
      }
      var keySecrets = keySecretsStore.setSecret(user, keyName, secret);
      if (!keySecrets) {
         throw { message: 'no command' };
      }
      var responseData = {
         keyName: keyName,
         user: user,
         custodianCount: keySecrets.custodianCount,
         secretCount: Object.keys(keySecrets.secrets).length,
         reqUrl: req.url
      };
      logger.info('reply', responseData);
      res.send(responseData);
      if (keySecrets.command === 'genKey') {
         if (Object.keys(keySecrets.secrets).length === keySecrets.custodianCount) {
            performGenKey(user, keyName, keySecrets);
         }
      } else if (keySecrets.command === 'loadKey') {
         if (Object.keys(keySecrets.secrets).length === 2) {
            performLoadKey(user, keyName, keySecrets);
         }
      }
   } catch (error) {
      handleError(res, error);
   }
}

function handlePostEncrypt(req, res) {
   try {
      var keyName = req.params.keyName;
      var user = req.peerCN;
      logger.info('receive encrypt', user, keyName);
      var datum = req.body;
      var responseData = {
         keyName: keyName,
         reqUrl: req.url
      };
      throw new Error('not implemented');
   } catch (error) {
      handleError(res, error);
   }
}
//# sourceMappingURL=Server.js.map