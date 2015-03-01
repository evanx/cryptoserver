
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
var log = bunyan.createLogger({name: "cryptoserver"});
var marked = require('marked');
var crypto = require('crypto');
var cryptoFunctions = require('./cryptoFunctions');
var commonFunctions = require('./commonFunctions');
var appFunctions = require('./appFunctions');
var genKey = require('./genKey');
var loadKey = require('./loadKey');
var keySecretsStore = require('./keySecretsStore');
var encryptHandler = require('./encryptHandler');

var redis = require('redis');

global.cryptoserver = exports;

exports.isProduction = (process.env.ENV_TYPE.toLowerCase().indexOf('prod') === 0);
exports.log = log;
exports.redisClient = redis.createClient();

exports.redisClient.on('error', function (err) {
   log.error('error', err);
});

function handleError(res, error) {
   log.error('error', error);
   if (error instanceof Error) {
      log.error('error stack', error.stack);
   }
   res.status(500).send(error);
}

function handleGet(req, res) {
   try {
      throw {message: 'unimplemented: ' + req.url};
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetKeyInfo(req, res) {
   try {
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
               error: 'error: ' + err,
            };
            res.status(500);
         } else if (reply.length) {
            responseData.properties = reply;
         } else {
            responseData.error = 'empty';
            res.status(500);
         }
         log.info('reply', redisKey, responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetGenKey(req, res) {
   try {
      var user = req.peerCN;
      var keyName = req.params.keyName;
      var redisKey = 'dek:' + keyName;
      var custodianCount = parseInt(req.params.count);
      if (custodianCount < 2 || custodianCount > 5) {
         throw {message: 'invalid custodian count'};
      }
      var responseData = {
         keyName: keyName,
         custodianCount: custodianCount,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
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
         log.info('reply', responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetLoadKey(req, res) {
   try {
      var user = req.peerCN;
      var keyName = req.params.keyName;
      var redisKey = 'dek:' + keyName;
      var responseData = {
         keyName: keyName,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(redisKey, function (err, reply) {
         log.info('hkeys', typeof reply, Array.isArray(reply));
         if (err) {
            responseData.error = err;
            res.status(500);
         } else if (!Object.keys(reply).length) {
            responseData.error = 'not found';
            res.status(500);
         } else {
            keySecretsStore.put(user, keyName, 'loadKey');
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
   return secret.length >= 12 &&
           /[A-Z]/.test(secret) &&
           /[a-z]/.test(secret) &&
           /\d/.test(secret) &&
           /\W/.test(secret);
}

function handlePostSecret(req, res) {
   try {
      var user = req.peerCN;
      var keyName = req.params.keyName;
      var secret = req.body;
      log.info('receive secret', user);
      if (exports.isProduction) {
         if (!validateSecretComplexity(secret)) {
            if (keySecrets.command === 'genKey') {
               throw {message: 'insufficient complexity'};
            }
         }
      }
      var keySecrets = keySecretsStore.setSecret(user, keyName, secret);
      if (!keySecrets) {
         throw {message: 'no command'};
      }
      var responseData = {
         keyName: keyName,
         user: user,
         custodianCount: keySecrets.custodianCount,
         secretCount: Object.keys(keySecrets.secrets).length,
         reqUrl: req.url
      };
      log.info('reply', responseData);
      res.send(responseData);
      if (keySecrets.command === 'genKey') {
         if (Object.keys(keySecrets.secrets).length === keySecrets.custodianCount) {
            genKey(exports, keySecrets, function (err) {
               if (err) {
                  log.error('genKey error', err);
               } else {
                  log.info('genKey ok', keyName);
                  keySecretsStore.clear(keyName);
               }
            });
         }
      } else if (keySecrets.command === 'loadKey') {
         if (Object.keys(keySecrets.secrets).length === 2) {
            loadKey(exports, keySecrets, function (err, dek) {
               if (err) {
                  log.error('loadKey error', err);
               } else {
                  log.info('loadKey ok', keyName, dek.length);
                  keySecretsStore.clear(keyName);
               }
            });
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
      log.info('receive encrypt', user, keyName);
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

function appLogger(req, res, next) {
   log.info('app', req.url);
   next();
}

function authorise(req, res, next) {
   log.info('authorise', req.url, req.peerCN);
   if (req.url === '/help') {
      next();
   } else if (!req.peerCN) {
      throw {message: 'not authorized'};
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
   req.pipe(concat(function (content) {
      req.body = content;
      next();
   }));
}

function monitor() {
   log.info('monitor');
   keySecretsStore.monitor();
}

function start(env) {
   exports.secretTimeoutSeconds = 120;
   if (env.SECRET_TIMEOUT_SECS) {
      exports.secretTimeoutSeconds = parseInt(env.SECRET_TIMEOUT_SECS);
   }
   keySecretsStore.init({secretTimeoutSeconds: exports.secretTimeoutSeconds});
   exports.monitorIntervalSeconds = 60;
   if (env.MONITOR_INTERVAL_SECONDS) {
      exports.monitorIntervalSeconds = parseInt(env.MONITOR_INTERVAL_SECONDS);
   }
   var options = {
      ca: fs.readFileSync(env.CA_CERT),
      key: fs.readFileSync(env.SERVER_KEY),
      cert: fs.readFileSync(env.SERVER_CERT),
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
   https.createServer(options, app).listen(env.APP_PORT);
   log.info('start', env.APP_PORT, env.ENV_TYPE);
   setInterval(monitor, exports.monitorIntervalSeconds * 1000);
}

exports.envNames = [
   'CA_CERT',
   'SERVER_CERT',
   'SERVER_KEY',
   'ENV_TYPE',
   'APP_PORT',
   'SECRET_TIMEOUT_SECS'
];

function validateEnv(env) {
   exports.envNames.forEach(function (envName) {
      var value = process.env[envName];
      if (!value) {
         throw new Error("missing env: " + envName);
      }
      log.info('env', envName, value);
   });
}

validateEnv(process.env);
start(process.env);

