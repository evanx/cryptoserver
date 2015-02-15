

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'keyserver', level: 'debug'});
var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function LoadKey(data) {
   this.keyName = data.keyName;
   this.redisKey = 'dek:' + data.keyName;
   this.secrets = data.secrets;
   this.users = Object.keys(data.secrets);
   this.users.sort();
   this.fields = {};
}

LoadKey.prototype = {
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
   loadKeyDuoTask: function (field, secret) {
      var instance = this;
      return function (callback) {
         instance.loadKeyDuo(field, secret, callback);
      };
   },
   loadKeyDuo: function (field, secret, callback) {
      var instance = this;
      log.info('loadKeyDuo', field, secret);
      cryptoUtils.pbkdf2(secret, this.salt, function (err, dek) {
         if (err) {
            log.error('pbkdf2 error', instance.keyName, field, err);
            callback(err);
         } else {
            var cipher = cryptoUtils.createCipheriv(dek, instance.iv);
            var encryptedSecret = cryptoUtils.encrypt(cipher, secret);
            var decipher = cryptoUtils.createDecipheriv(dek, instance.iv);
            var decryptedSecret = cryptoUtils.decrypt(decipher, encryptedSecret);
            instance.fields[field] = encryptedSecret;
            log.info('pbkdf2 done', instance.keyName, Object.keys(instance.fields).length, field, dek.length, encryptedSecret.length, decryptedSecret);
            callback();
         }
      });
   },
   loadKeyUsers: function (done) {
      var instance = this;
      log.info('loadKeyUsers', instance.users, instance.salt.length, instance.iv.length);
      var tasks = [];
      for (var i = 0; i < instance.users.length; i++) {
         for (var j = 0; j < instance.users.length; j++) {
            if (j > i) {
               var field = [instance.users[i], instance.users[j]].join(':');
               var secret = instance.secrets[instance.users[i]] + ':' + instance.secrets[instance.users[j]];
               tasks.push(instance.loadKeyDuoTask(field, secret));
            }
         }
      }
      async.parallel(tasks, function (err, results) {
         if (err) {
            log.info('loadKeyUsers error', err);
            done(err);
         } else {
            done();
         }
      });
   },
   load: function (done) {
      var instance = this;
      cryptoUtils.loadSalt(function (err, salt) {
         if (err) {
            log.error('salt error', instance.keyName, err);
         } else {
            instance.salt = salt;
            cryptoUtils.loadIv(function (err, iv) {
               if (err) {
                  log.error('iv error', instance.keyName, err);
               } else {
                  instance.iv = iv;
                  instance.loadKeyUsers(done);
               }
            });
         }
      });

   },
   perform: function (done) {
      var instance = this;
      log.info('loadKey', instance.keyName);
      try {
         cryptoUtils.loadKey(function (err, loadedKey) {
            if (err) {
               log.info('loadKey error', instance.keyName, instance.users);
            } else {
               log.info('loadedKey', instance.keyName, instance.users, this.redisKey, loadedKey.length);
               global.keyserver.redisClient.exists(instance.redisKey, function (err, exists) {
                  if (err) {
                     log.error('redis error', err);
                  } else if (exists) {
                     log.error('not found');
                  } else {
                     log.info('loadKey', instance.redisKey);
                     instance.load(function (err) {
                        if (err) {
                           done(err);
                        } else {
                           instance.exec();
                           done();
                        }
                     });
                  }
               });
            }
         });
      } catch (error) {
         log.error('loadKey', error);
      }
   }
};

module.exports = LoadKey;
