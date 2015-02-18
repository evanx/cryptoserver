

var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function LoadKey(cryptoserver) {
   this.cryptoserver = cryptoserver;
   this.keyName = cryptoserver.data.keyName;
   this.redisKey = 'dek:' + cryptoserver.data.keyName;
   this.secrets = cryptoserver.data.secrets;
   this.users = Object.keys(cryptoserver.data.secrets);
   this.users.sort();
   this.log = cryptoserver.log.child({keyName: this.keyName, sourceName: 'LoadKey', level: 'debug'});
   this.fields = {};
}

LoadKey.prototype = {
   decryptDuo: function (duo, secret, encryptedDek, callback) {
      var instance = this;
      instance.log.debug('decryptDuo', duo, encryptedDek);
      cryptoUtils.pbkdf2(secret, this.salt, function (err, kek) {
         if (err) {
            instance.log.error('pbkdf2 error', duo, err);
            callback(err);
         } else {
            var decipher = cryptoUtils.createDecipheriv(kek, instance.iv);
            var clearDek = cryptoUtils.decrypt(decipher, encryptedDek);
            instance.log.info('pbkdf2 done', Object.keys(instance.fields).length, duo, kek.length, encryptedDek.length, clearDek);
            callback(clearDek);
         }
      });
   },
   findDuo: function (hashset) {
      var instance = this;
      for (var field in hashset) {
         if (field.indexOf('dek:') === 0) {
            var duo = field.split(':').slice(1);
            if (instance.secrets[duo[0]] && instance.secrets[duo[1]]) {
               instance.log.info('dek', field, instance.secrets[duo[0]].length, instance.secrets[duo[1]].length);
               return duo;
            } else {
               instance.log.debug('dek skip', field);
            }
         }
      }
      throw {message: 'duo not found'};
   },
   hgetallReply: function (hashset) {
      var instance = this;
      instance.log.info('hgetallReply', Object.keys(hashset), hashset.salt.length, hashset.iv.length);
      instance.salt = new Buffer(hashset.salt, 'base64');
      instance.iv = new Buffer(hashset.iv, 'base64');
      instance.duo = instance.findDuo(hashset);
      var secret = instance.secrets[instance.duo[0]] + ':' + instance.secrets[instance.duo[1]];
      var encryptedDek = hashset['dek:' + instance.duo.join(':')];
      instance.decryptDuo(instance.duo, secret, encryptedDek, function (clearKey) {
         log.error('clearKey', clearKey);
      });
   },
   hgetall: function () {
      var instance = this;
      global.cryptoserver.redisClient.hgetall(instance.redisKey, function (err, reply) {
         if (err) {
            instance.log.error('hgetall error');
         } else {
            instance.hgetallReply(reply);
         }
      });
   },
   perform: function (done) {
      var instance = this;
      instance.log.info('perform');
      try {
         instance.hgetall();
      } catch (error) {
         instance.log.error('loadKey', error);
      }
   }
};

module.exports = LoadKey;
