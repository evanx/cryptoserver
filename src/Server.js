
const fs = require('fs');
const async = require('async');
const lodash = require('lodash');
const express = require('express');
const app = express();
const https = require('https');
const bodyParser = require('body-parser')
const concat = require('concat-stream');
const bunyan = require('bunyan');
const marked = require('marked');
const crypto = require('crypto');

const Crypto = require('./Crypto');
const Common = require('./Common');
const genKey = require('./genKey');
const loadKey = require('./loadKey');
const keySecretsStore = require('./keySecretsStore');
const keyStore = require('./keyStore');
const encryptHandler = require('./encryptHandler');

const redis = require('redis');

global.cryptoserver = exports;

exports.logger = logger;
exports.redisClient = redis.createClient();

exports.redisClient.on('error', function (err) {
   logger.error('error', err);
});

function start() {
   const env = process.env;
   validateEnv(env);
   exports.secretTimeoutSeconds = 120;
   if (env.Server_secretTimeoutSeconds) {
      exports.secretTimeoutSeconds = parseInt(env.Server_secretTimeoutSeconds);
   }
   keySecretsStore.init({secretTimeoutSeconds: exports.secretTimeoutSeconds});
   exports.monitorIntervalSeconds = 60;
   if (env.Server_monitorIntervalSeconds) {
      exports.monitorIntervalSeconds = parseInt(env.Server_monitorIntervalSeconds);
   }
   const options = {
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
   https.createServer(options, app).listen(env.Server_port);
   logger.info('start', env.Server_port, env.NODE_ENV);
   setInterval(monitor, exports.monitorIntervalSeconds * 1000);
}

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
      const cert = req.socket.getPeerCertificate();
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
      throw {message: 'unimplemented: ' + req.url};
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetKeyInfo(req, res) {
   try {
      const user = req.peerCN;
      const keyName = req.params.keyName;
      const redisKey = 'dek:' + keyName;
      exports.redisClient.hkeys(redisKey, function (err, reply) {
         const responseData = {
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
         logger.info('reply', redisKey, responseData);
         res.json(responseData);
      });
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetGenKey(req, res) {
   try {
      const user = req.peerCN;
      const keyName = req.params.keyName;
      const redisKey = 'dek:' + keyName;
      const custodianCount = parseInt(req.params.count);
      if (custodianCount < 2 || custodianCount > 5) {
         throw {message: 'invalid custodian count'};
      }
      const responseData = {
         keyName: keyName,
         custodianCount: custodianCount,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(redisKey, function (err, reply) {
         logger.info('hkeys', typeof reply, Array.isArray(reply));
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
   } catch (error) {
      handleError(res, error);
   }
}

function handleGetLoadKey(req, res) {
   try {
      const user = req.peerCN;
      const keyName = req.params.keyName;
      const redisKey = 'dek:' + keyName;
      const responseData = {
         keyName: keyName,
         reqUrl: req.url
      };
      exports.redisClient.hkeys(redisKey, function (err, reply) {
         logger.info('hkeys', typeof reply, Array.isArray(reply));
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
      const user = req.peerCN;
      const keyName = req.params.keyName;
      const secret = req.body;
      const command = 'genKey'; // TODO
      logger.info('receive secret', user);
      if (process.env.NODE_ENV === 'production') {
         if (!validateSecretComplexity(secret)) {
            if (command === 'genKey') {
               throw {message: 'insufficient complexity'};
            }
         }
      }
      const keySecrets = keySecretsStore.setSecret(user, keyName, secret);
      if (!keySecrets) {
         throw {message: 'no command'};
      }
      const responseData = {
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
      const keyName = req.params.keyName;
      const user = req.peerCN;
      logger.info('receive encrypt', user, keyName);
      const datum = req.body;
      const responseData = {
         keyName: keyName,
         reqUrl: req.url
      };
      throw new Error('not implemented');
   } catch (error) {
      handleError(res, error);
   }
}
