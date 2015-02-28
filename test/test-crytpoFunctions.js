
var async = require('async');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: module.filename, level: 'debug'});
var cryptoFunctions = require('../lib/cryptoFunctions');
var commonFunctions = require('../lib/commonFunctions');
var appFunctions = require('../lib/appFunctions');
var cryptoFunctionsAsync = require('./cryptoFunctionsAsync');


function test() {
   var cryptoAsync = cryptoFunctionsAsync.create({
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
         var cipher = cryptoFunctions.createCipheriv(results.key, results.iv);
         var decipher = cryptoFunctions.createDecipheriv(results.key, results.iv);
         var clearText = "hello, crypto world!";
         var encrypted = cryptoFunctions.encrypt(cipher, clearText);
         var decrypted = cryptoFunctions.decrypt(decipher, encrypted);
         log.info('decrypted', typeof decrypted, decrypted.length, decrypted);         
      }
   });
}

test();