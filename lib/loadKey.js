
var commonFunctions = require('./commonFunctions');
var cryptoFunctions = require('./cryptoFunctions');
var async = require('async');
var bunyan = require('bunyan');

module.exports = function (cryptoserver, keySecrets, done) {
   var that = {};
   that.cryptoserver = cryptoserver;
   that.keyName = keySecrets.keyName;
   that.redisKey = 'dek:' + keySecrets.keyName;
   that.secrets = keySecrets.secrets;
   that.users = Object.keys(keySecrets.secrets);
   that.users.sort();
   that.fields = {};

   var log = bunyan.createLogger({name: 'cryptoserver.loadKey.' + that.keyName});

   function decryptDuo(duo, secret, encryptedDek) {
      log.debug('decryptDuo', duo, encryptedDek);
      cryptoFunctions.pbkdf2(secret, that.salt, function (err, kek) {
         if (err) {
            log.error('decryptDuo pbkdf2 error', err);
            done(err);
         } else {
            var decipher = cryptoFunctions.createDecipheriv(kek, that.iv);
            var clearDek = cryptoFunctions.decryptBuffer(decipher, new Buffer(encryptedDek, 'base64'));
            log.info('decryptDuo', duo, kek.length, encryptedDek.length);
            done(null, clearDek);
         }
      });
   }

   function findDuo(hashset) {
      for (var field in hashset) {
         if (field.indexOf('dek:') === 0) {
            var duo = field.split(':').slice(1);
            if (that.secrets[duo[0]] && that.secrets[duo[1]]) {
               log.info('dek', field, that.secrets[duo[0]].length, that.secrets[duo[1]].length);
               return duo;
            } else {
               log.debug('dek skip', field);
            }
         }
      }
      throw {message: 'duo not found'};
   }

   function hgetallReply(hashset) {
      log.info('hgetallReply', Object.keys(hashset), hashset.salt.length, hashset.iv.length);
      that.salt = new Buffer(hashset.salt, 'base64');
      that.iv = new Buffer(hashset.iv, 'base64');
      that.duo = findDuo(hashset);
      var secret = that.secrets[that.duo[0]] + ':' + that.secrets[that.duo[1]];
      var encryptedDek = hashset['dek:' + that.duo.join(':')];
      decryptDuo(that.duo, secret, encryptedDek);
   }

   function hgetall() {
      that.cryptoserver.redisClient.hgetall(that.redisKey, function (err, reply) {
         if (err) {
            log.error('hgetall error');
         } else {
            hgetallReply(reply);
         }
      });
   }

   try {
      hgetall();
   } catch (error) {
      log.error('loadKey', error);
   }
};


