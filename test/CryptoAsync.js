
var async = require('async');
var crypto = require('crypto');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver", level: 'debug'});
var commonUtils = require('../lib/commonUtils');
var cryptoUtils = require('../lib/cryptoUtils');

function CryptoAsync(options) {
   var results = {};
   this.randomKey = function (callback) {
      cryptoUtils.randomKey(function (err, result) {
         results.key = result;
         callback(err, result);
      });
   };
   this.randomSalt = function (callback) {
      cryptoUtils.randomSalt(function (err, result) {
         results.salt = result;
         callback(err, result);
      });
   };
   this.randomIv = function (callback) {
      cryptoUtils.randomIv(function (err, result) {
         results.iv = result;
         callback(err, result);
      });
   };
   this.pbkdf2 = function (callback) {
      cryptoUtils.pbkdf2(options.secret, results.salt, function (err, buffer) {
         if (err) {
            callback(err);
         } else {
            log.info('pbkdf2 result', buffer.length, buffer.toString('base64'));
            results.pbkdf2 = buffer;
            callback(err, buffer);
         }
      });
   };
   this.getResults = function() {
      return results;
   }
   this.logResults = function() {
      log.info('salt', results.salt.length);
      log.info('iv', results.iv.length);
      log.info('key', results.key.length);
      log.info('pbkdf2', results.pbkdf2.length);
   }
}

module.exports = CryptoAsync;

