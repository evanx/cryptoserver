
var async = require('async');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: module.filename, level: 'debug'});
var cryptoUtils = require('../lib/cryptoUtils');
var commonUtils = require('../lib/commonUtils');
var appUtils = require('../lib/appUtils');
var CryptoAsync = require('./CryptoAsync');


function test() {
   var cryptoAsync = new CryptoAsync({
      secret: 'aaaa:bbbb'
   });
   async.series([
      cryptoAsync.randomSalt,
      cryptoAsync.randomIv,
      cryptoAsync.randomKey,
      cryptoAsync.pbkdf2      
   ], function (err) {
      if (err) {
         log.err('error', err);
      } else {
         cryptoAsync.logResults();   
         var results = cryptoAsync.getResults();
         var cipher = cryptoUtils.createCipheriv(results.key, results.iv);
         var decipher = cryptoUtils.createDecipheriv(results.key, results.iv);
         var clearText = "hello, crypto world!";
         var encrypted = cryptoUtils.encrypt(cipher, clearText);
         var decrypted = cryptoUtils.decrypt(decipher, encrypted);
         log.info('decrypted', typeof decrypted, decrypted.length, decrypted);         
      }
   });
}

test();