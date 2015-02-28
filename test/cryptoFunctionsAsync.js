
var async = require('async');
var crypto = require('crypto');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver", level: 'debug'});
var commonFunctions = require('../lib/commonFunctions');
var cryptoFunctions = require('../lib/cryptoFunctions');

exports.create = function (options) {
   var results = {};
   var functions = {
      randomKey: function (callback) {
         cryptoFunctions.randomKey(function (err, result) {
            results.key = result;
            callback(err, result);
         });
      },
      randomSalt: function (callback) {
         cryptoFunctions.randomSalt(function (err, result) {
            results.salt = result;
            callback(err, result);
         });
      },
      randomIv: function (callback) {
         cryptoFunctions.randomIv(function (err, result) {
            results.iv = result;
            callback(err, result);
         });
      },
      pbkdf2: function (callback) {
         cryptoFunctions.pbkdf2(options.secret, results.salt, function (err, buffer) {
            if (err) {
               callback(err);
            } else {
               log.info('pbkdf2 result', buffer.length, buffer.toString('base64'));
               results.pbkdf2 = buffer;
               callback(err, buffer);
            }
         });
      },
      getResults: function () {
         return results;
      },
      logResults: function () {
         log.info('salt', results.salt.length);
         log.info('iv', results.iv.length);
         log.info('key', results.key.length);
         log.info('pbkdf2', results.pbkdf2.length);
      }
   };
   return functions;
}


