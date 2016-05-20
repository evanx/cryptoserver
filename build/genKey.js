'use strict';

var async = require('async');
var bunyan = require('bunyan');
var bufferEquals = require('buffer-equal');

var Common = require('./Common');
var Crypto = require('./Crypto');

module.exports = function (cryptoserver, keySecrets, done) {
   var that = {};
   that.cryptoserver = cryptoserver;
   that.keyName = keySecrets.keyName;
   that.redisKey = 'dek:' + keySecrets.keyName;
   that.secrets = keySecrets.secrets;
   that.users = Object.keys(keySecrets.secrets).sort();
   that.users.sort();
   that.encryptedItems = [];

   var logger = bunyan.createLogger({ name: 'cryptoserver.genKey.' + that.keyName, level: 'debug' });

   function save() {
      var multi = that.cryptoserver.redisClient.multi();
      multi.hset(that.redisKey, 'iterationCount', Crypto.options.iterationCount);
      multi.hset(that.redisKey, 'salt', that.salt.toString('base64'));
      multi.hset(that.redisKey, 'algorithm', Crypto.options.algorithm);
      multi.hset(that.redisKey, 'iv', that.iv.toString('base64'));
      logger.info('redis multi exec', that.encryptedItems.length);
      that.encryptedItems.forEach(function (encryptedItem) {
         var redisField = 'dek:' + encryptedItem.duo.join(':');
         multi.hset(that.redisKey, redisField, encryptedItem.encryptedDek.toString('base64'));
         logger.debug('hset', redisField);
      });
      multi.exec(function (err, replies) {
         if (err) {
            logger.error('redis multi exec error', err);
            done(err);
         } else {
            logger.info('redis multi exec done', replies.length);
            done();
         }
      });
   }

   function encryptDuoKek(duo, kek) {
      var cipher = Crypto.createCipheriv(kek, that.iv);
      var encryptedDek = Crypto.encryptBuffer(cipher, that.generatedDek);
      that.encryptedItems.push({
         duo: duo,
         encryptedDek: encryptedDek
      });
      var decipher = Crypto.createDecipheriv(kek, that.iv);
      var decryptedDek = Crypto.decryptBuffer(decipher, encryptedDek);
      logger.debug('decryptedDek', duo, decryptedDek.length, that.generatedDek.length);
      if (!bufferEquals(decryptedDek, that.generatedDek)) {
         throw { message: 'encryption verification failed' };
      }
      logger.info('verified', duo, Object.keys(that.encryptedItems).length);
   }

   function encryptDuoTask(duo, clearSecret) {
      return function (callback) {
         logger.info('encryptDuoTask', duo);
         Crypto.pbkdf2(clearSecret, that.salt, function (err, kek) {
            if (err) {
               logger.error('pbkdf2 error', duo, err);
               callback(err);
            } else {
               encryptDuoKek(duo, kek);
               callback();
            }
         });
      };
   }

   function genKeyUsers() {
      logger.info('genKeyUsers', that.users, that.salt.length, that.iv.length);
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
            logger.info('genKeyUsers error', err);
            done(err);
         } else {
            save();
         }
      });
   }

   function genKey() {
      Crypto.randomKey(function (err, generatedDek) {
         if (err) {
            logger.info('genKey error', that.users);
            done(err);
         } else {
            that.generatedDek = generatedDek;
            logger.debug('generatedDek', that.generatedDek.length);
            genKeyUsers();
         }
      });
   }

   function generate() {
      async.parallel([function (callback) {
         Crypto.randomSalt(function (err, salt) {
            if (err) {
               logger.error('salt error', err);
               callback(err);
            } else {
               that.salt = salt;
               logger.info('salt', salt.length);
               callback(null, salt);
            }
         });
      }, function (callback) {
         Crypto.randomIv(function (err, iv) {
            if (err) {
               logger.error('iv error', err);
               callback(err);
            } else {
               logger.info('iv', iv.length);
               that.iv = iv;
               callback(null, iv);
            }
         });
      }], function (err) {
         if (err) {
            done(err);
         } else {
            genKey();
         }
      });
   }

   logger.info('genKey', that.users, that.redisKey);
   try {
      that.cryptoserver.redisClient.exists(that.redisKey, function (err, exists) {
         if (err) {
            logger.error('redis error', err);
            done(err);
         } else if (exists) {
            err = 'already exists';
            done(err);
         } else {
            logger.info('generate', that.redisKey);
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
      logger.error('genKey', error);
   }
};
//# sourceMappingURL=genKey.js.map