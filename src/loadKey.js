
var async = require('async');
var bunyan = require('bunyan');

var Common = require('./Common');
var Crypto = require('./Crypto');

module.exports = function (cryptoserver, keySecrets, done) {
   var that = {};
   that.cryptoserver = cryptoserver;
   that.keyName = keySecrets.keyName;
   that.redisKey = 'dek:' + keySecrets.keyName;
   that.secrets = keySecrets.secrets;
   that.users = Object.keys(keySecrets.secrets);
   that.users.sort();
   that.fields = {};

   var logger = bunyan.createLogger({name: 'cryptoserver.loadKey.' + that.keyName});

   function decryptDuo(duo, secret, encryptedDek) {
      logger.debug('decryptDuo', duo, encryptedDek);
      Crypto.pbkdf2(secret, that.salt, function (err, kek) {
         if (err) {
            logger.error('decryptDuo pbkdf2 error', err);
            done(err);
         } else {
            var decipher = Crypto.createDecipheriv(kek, that.iv);
            var decryptedDek = Crypto.decryptBuffer(decipher, new Buffer(encryptedDek, 'base64'));
            logger.info('decryptDuo', duo, kek.length, encryptedDek.length);
            done(null, decryptedDek);
         }
      });
   }

   function findDuo(hashset) {
      for (var field in hashset) {
         if (field.indexOf('dek:') === 0) {
            var duo = field.split(':').slice(1);
            if (that.secrets[duo[0]] && that.secrets[duo[1]]) {
               logger.info('dek', field, that.secrets[duo[0]].length, that.secrets[duo[1]].length);
               return duo;
            } else {
               logger.debug('dek skip', field);
            }
         }
      }
      throw {message: 'duo not found'};
   }

   function hgetallReply(hashset) {
      logger.info('hgetallReply', Object.keys(hashset), hashset.salt.length, hashset.iv.length);
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
            logger.error('hgetall error');
         } else {
            hgetallReply(reply);
         }
      });
   }

   try {
      hgetall();
   } catch (error) {
      logger.error('loadKey', error);
   }
};
