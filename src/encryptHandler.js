
const async = require('async');
const bunyan = require('bunyan');
const bufferEquals = require('buffer-equal');

const Common = require('./Common');
const Crypto = require('./Crypto');

module.exports = function (cryptoserver, keySecrets, done) {
   const that = {};
   that.cryptoserver = cryptoserver;
   that.keyName = keySecrets.keyName;
   that.redisKey = 'dek:' + keySecrets.keyName;
   that.secrets = keySecrets.secrets;
   that.users = Object.keys(keySecrets.secrets).sort();
   that.users.sort();
   that.encryptedItems = [];

   const logger = bunyan.createLogger({name: 'cryptoserver.genKey.' + that.keyName, level: 'debug'});

   function save() {
      const multi = that.cryptoserver.redisClient.multi();
      multi.hset(that.redisKey, 'iterationCount', Crypto.options.iterationCount);
      multi.hset(that.redisKey, 'salt', that.salt.toString('base64'));
      multi.hset(that.redisKey, 'algorithm', Crypto.options.algorithm);
      multi.hset(that.redisKey, 'iv', that.iv.toString('base64'));
      logger.info('redis multi exec', that.encryptedItems.length);
      that.encryptedItems.forEach(function (encryptedItem) {
         const redisField = 'dek:' + encryptedItem.duo.join(':');
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
      const cipher = Crypto.createCipheriv(kek, that.iv);
      const encryptedDek = Crypto.encryptBuffer(cipher, that.generatedDek);
      that.encryptedItems.push({
         duo: duo,
         encryptedDek: encryptedDek
      });
      const decipher = Crypto.createDecipheriv(kek, that.iv);
      const decryptedDek = Crypto.decryptBuffer(decipher, encryptedDek);
      logger.debug('decryptedDek', duo, decryptedDek.length, that.generatedDek.length);
      if (!bufferEquals(decryptedDek, that.generatedDek)) {
         throw {message: 'encryption verification failed'};
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
      const tasks = [];
      for (let i = 0; i < that.users.length; i++) {
         for (let j = 0; j < that.users.length; j++) {
            if (j > i) {
               const duo = [that.users[i], that.users[j]];
               const clearSecret = that.secrets[duo[0]] + ':' + that.secrets[duo[1]];
               tasks.push(encryptDuoTask(duo, clearSecret));
            }
         }
      }
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
      async.parallel([
         function (callback) {
            Crypto.randomSalt(function (err, salt) {
               if (err) {
                  logger.error('salt error', err);
                  callback(err);
               } else {
                  that.salt = salt;
                  logger.info('salt', salt.length);
                  callback(null, salt);
               }
            })
         },
         function (callback) {
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
         }
      ], function (err) {
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
            logger.info('genKey', that.redisKey);
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
