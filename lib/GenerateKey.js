

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'keyserver', level: 'debug'});
var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function GenerateKey(data) {
   this.keyName = data.keyName;
   this.redisKey = 'dek:' + data.keyName;
   this.secrets = data.secrets;
   this.users = Object.keys(data.secrets);
   this.users.sort();
   this.fields = {};
}

GenerateKey.prototype = {
   exec: function () {
      var instance = this;
      var multi = global.keyserver.redisClient.multi();
      instance.fields.salt = instance.salt;
      instance.fields.iv = instance.iv;
      log.info('exec', Object.keys(instance.fields));
      for (var field in instance.fields) {
         multi.hset(instance.redisKey, field, instance.fields[field]);
         log.debug('hset', instance.keyName, field);
      }
      multi.exec(function (err, replies) {
         if (err) {
            log.error('redis multi exec error', instance.keyName, err);
         } else {
            log.info('redis multi exec done', instance.keyName);
         }
      });
   },
   generateKeyDuo: function (field, secret, callback) {
      var instance = this;
      log.info('generateKeyDuo', field, secret);
      cryptoUtils.pbkdf2(secret, this.salt, function (err, dek) {
         if (err) {
            log.error('pbkdf2 error', instance.keyName, field, err);
         } else {
            var cipher = cryptoUtils.createCipheriv(dek, instance.iv);
            var encryptedSecret = cryptoUtils.encrypt(cipher, secret);
            var decipher = cryptoUtils.createDecipheriv(dek, instance.iv);
            var decryptedSecret = cryptoUtils.decrypt(decipher, encryptedSecret);
            instance.fields[field] = encryptedSecret;
            log.info('pbkdf2 done', instance.keyName, Object.keys(instance.fields).length, field, dek.length, encryptedSecret.length, decryptedSecret);
         }
         callback();
      });
   },
   generateKeyUsers: function () {
      var instance = this;
      instance.countdownLatch = commonUtils.countdownLatch(3, this.exec.bind(this));
      log.info('generateKeyUsers', instance.users, instance.salt.length, instance.iv.length);
      for (var i = 0; i < instance.users.length; i++) {
         for (var j = 0; j < instance.users.length; j++) {
            if (j > i) {
               var field = [instance.users[i], instance.users[j]].join(':');
               var secret = instance.secrets[instance.users[i]] + ':' + instance.secrets[instance.users[j]];
               instance.generateKeyDuo(field, secret, instance.countdownLatch);
            }
         }
      }
   },
   generate: function () {
      var instance = this;
      cryptoUtils.generateSalt(function (err, salt) {
         if (err) {
            log.error('salt error', instance.keyName, err);
         } else {
            instance.salt = salt;
            cryptoUtils.generateIv(function (err, iv) {
               if (err) {
                  log.error('iv error', instance.keyName, err);
               } else {
                  instance.iv = iv;
                  instance.generateKeyUsers();
               }
            });
         }
      });

   },
   perform: function () {
      var instance = this;
      log.info('generateKey ', instance.keyName);
      try {
         cryptoUtils.generateKey(function (err, generatedKey) {
            if (err) {
               log.info('generateKey error', instance.keyName, instance.users);
            } else {
               log.info('generatedKey', instance.keyName, instance.users, this.redisKey, generatedKey.length);
               global.keyserver.redisClient.exists(instance.redisKey, function (err, exists) {
                  if (err) {
                     log.error('redis error', err);
                  } else if (exists) {
                     log.error('Key already exists: ' + this.redisKey);
                  } else {
                     log.info('New key: ' + this.redisKey);
                     instance.generate();
                  }
               });
            }
         });
      } catch (error) {
         log.error('generateKey', error);
      }
   }
};

module.exports = GenerateKey;
