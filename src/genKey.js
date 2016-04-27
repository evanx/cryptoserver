
var commonFunctions = require('./commonFunctions');
var cryptoFunctions = require('./cryptoFunctions');
var async = require('async');
var bunyan = require('bunyan');
var bufferEquals = require('buffer-equal');

module.exports = function (cryptoserver, keySecrets, done) {
   var that = {};
   that.cryptoserver = cryptoserver;
   that.keyName = keySecrets.keyName;
   that.redisKey = 'dek:' + keySecrets.keyName;
   that.secrets = keySecrets.secrets;
   that.users = Object.keys(keySecrets.secrets).sort();
   that.users.sort();
   that.encryptedItems = [];

   var log = bunyan.createLogger({name: 'cryptoserver.genKey.' + that.keyName, level: 'debug'});

   function save() {
      var multi = that.cryptoserver.redisClient.multi();
      multi.hset(that.redisKey, 'iterationCount', cryptoFunctions.options.iterationCount);
      multi.hset(that.redisKey, 'salt', that.salt.toString('base64'));
      multi.hset(that.redisKey, 'algorithm', cryptoFunctions.options.algorithm);
      multi.hset(that.redisKey, 'iv', that.iv.toString('base64'));
      log.info('redis multi exec', that.encryptedItems.length);
      that.encryptedItems.forEach(function (encryptedItem) {
         var redisField = 'dek:' + encryptedItem.duo.join(':');
         multi.hset(that.redisKey, redisField, encryptedItem.encryptedDek.toString('base64'));
         log.debug('hset', redisField);
      });
      multi.exec(function (err, replies) {
         if (err) {
            log.error('redis multi exec error', err);
            done(err);
         } else {
            log.info('redis multi exec done', replies.length);
            done();
         }
      });
   }

   function encryptDuoKek(duo, kek) {
      var cipher = cryptoFunctions.createCipheriv(kek, that.iv);
      var encryptedDek = cryptoFunctions.encryptBuffer(cipher, that.generatedDek);
      that.encryptedItems.push({
         duo: duo,
         encryptedDek: encryptedDek
      });
      var decipher = cryptoFunctions.createDecipheriv(kek, that.iv);
      var decryptedDek = cryptoFunctions.decryptBuffer(decipher, encryptedDek);
      log.debug('decryptedDek', duo, decryptedDek.length, that.generatedDek.length);
      if (!bufferEquals(decryptedDek, that.generatedDek)) {
         throw {message: 'encryption verification failed'};
      }
      log.info('verified', duo, Object.keys(that.encryptedItems).length);
   }

   function encryptDuoTask(duo, clearSecret) {
      return function (callback) {
         log.info('encryptDuoTask', duo);
         cryptoFunctions.pbkdf2(clearSecret, that.salt, function (err, kek) {
            if (err) {
               log.error('pbkdf2 error', duo, err);
               callback(err);
            } else {
               encryptDuoKek(duo, kek);
               callback();
            }
         });
      };
   }

   function genKeyUsers() {
      log.info('genKeyUsers', that.users, that.salt.length, that.iv.length);
      var tasks = [];
      that.users.forEach(function (user0) {
         that.users.forEach(function (user1) {
            if (user0 < user1) {
               var duo = [user0, user1];
               var clearSecret = that.secrets[user0] + ':' + that.secrets[user1];
               tasks.push(encryptDuoTask(duo, clearSecret));               
            }
         });
      });
      async.parallel(tasks, function (err) {
         if (err) {
            log.info('genKeyUsers error', err);
            done(err);
         } else {
            save();
         }
      });
   }

   function genKey() {
      cryptoFunctions.randomKey(function (err, generatedDek) {
         if (err) {
            log.info('genKey error', that.users);
            done(err);
         } else {
            that.generatedDek = generatedDek;
            log.debug('generatedDek', that.generatedDek.length);
            genKeyUsers();
         }
      });
   }

   function generate() {
      async.parallel([
         function (callback) {
            cryptoFunctions.randomSalt(function (err, salt) {
               if (err) {
                  log.error('salt error', err);
                  callback(err);
               } else {
                  that.salt = salt;
                  log.info('salt', salt.length);
                  callback(null, salt);
               }
            })
         },
         function (callback) {
            cryptoFunctions.randomIv(function (err, iv) {
               if (err) {
                  log.error('iv error', err);
                  callback(err);
               } else {
                  log.info('iv', iv.length);
                  that.iv = iv;
                  callback(null, iv);
               }
            });
         }
      ], function (err) {
         if (err) {
            done(err);
         } else {
            genKey();
         }
      });
   }

   log.info('genKey', that.users, that.redisKey);
   try {
      that.cryptoserver.redisClient.exists(that.redisKey, function (err, exists) {
         if (err) {
            log.error('redis error', err);
            done(err);
         } else if (exists) {
            err = 'already exists';
            done(err);
         } else {
            log.info('generate', that.redisKey);
            generate(function (err) {
               if (err) {
                  done(err);
               } else {
                  save();
                  done();
               }
            });
         }
      });
   } catch (error) {
      log.error('genKey', error);
   }
};

