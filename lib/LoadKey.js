
var commonFunctions = require('./commonFunctions');
var cryptoFunctions = require('./cryptoFunctions');
var async = require('async');
var bunyan = require('bunyan');

function LoadKey(cryptoserver, keySecrets) {
   this.cryptoserver = cryptoserver;
   this.keyName = keySecrets.keyName;
   this.redisKey = 'dek:' + keySecrets.keyName;
   this.secrets = keySecrets.secrets;
   this.users = Object.keys(keySecrets.secrets);
   this.users.sort();
   this.log = bunyan.createLogger({name: 'cryptoserver.loadKey.' + this.keyName});
   this.fields = {};
}

LoadKey.prototype = {
   decryptDuo: function (duo, secret, encryptedDek, callback) {
      var that = this;
      that.log.debug('decryptDuo', duo, encryptedDek);
      cryptoFunctions.pbkdf2(secret, this.salt, function (err, kek) {
         if (err) {
            that.log.error('pbkdf2 error', duo, err);
            callback(err);
         } else {
            var decipher = cryptoFunctions.createDecipheriv(kek, that.iv);
            var clearDek = cryptoFunctions.decrypt(decipher, encryptedDek);
            that.log.info('pbkdf2 done', Object.keys(that.fields).length, duo, kek.length, encryptedDek.length, clearDek);
            callback(clearDek);
         }
      });
   },
   findDuo: function (hashset) {
      var that = this;
      for (var field in hashset) {
         if (field.indexOf('dek:') === 0) {
            var duo = field.split(':').slice(1);
            if (that.secrets[duo[0]] && that.secrets[duo[1]]) {
               that.log.info('dek', field, that.secrets[duo[0]].length, that.secrets[duo[1]].length);
               return duo;
            } else {
               that.log.debug('dek skip', field);
            }
         }
      }
      throw {message: 'duo not found'};
   },
   hgetallReply: function (hashset) {
      var that = this;
      that.log.info('hgetallReply', Object.keys(hashset), hashset.salt.length, hashset.iv.length);
      that.salt = new Buffer(hashset.salt, 'base64');
      that.iv = new Buffer(hashset.iv, 'base64');
      that.duo = that.findDuo(hashset);
      var secret = that.secrets[that.duo[0]] + ':' + that.secrets[that.duo[1]];
      var encryptedDek = hashset['dek:' + that.duo.join(':')];
      that.decryptDuo(that.duo, secret, encryptedDek, function (clearKey) {
         log.error('clearKey', clearKey);
      });
   },
   hgetall: function () {
      var that = this;
      that.cryptoserver.redisClient.hgetall(that.redisKey, function (err, reply) {
         if (err) {
            that.log.error('hgetall error');
         } else {
            that.hgetallReply(reply);
         }
      });
   },
   perform: function (done) {
      var that = this;
      that.log.info('perform');
      try {
         that.hgetall();
      } catch (error) {
         that.log.error('loadKey', error);
      }
   }
};

module.exports = LoadKey;

