
var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function GenerateKey(keyserver) {
   this.keyserver = keyserver;
   this.keyName = keyserver.data.keyName;
   this.redisKey = 'dek:' + keyserver.data.keyName;
   this.secrets = keyserver.data.secrets;
   this.users = Object.keys(keyserver.data.secrets);
   this.users.sort();
   this.log = keyserver.log.child({keyName: this.keyName});
   this.fields = {};
}

GenerateKey.prototype = {
   exec: function () {
      var instance = this;
      var multi = global.keyserver.redisClient.multi();
      instance.fields.salt = instance.salt;
      instance.fields.iv = instance.iv;
      instance.log.info('exec', Object.keys(instance.fields));
      for (var field in instance.fields) {
         multi.hset(instance.redisKey, field, instance.fields[field]);
         instance.log.debug('hset', field);
      }
      multi.exec(function (err, replies) {
         if (err) {
            instance.log.error('redis multi exec error', err);
         } else {
            instance.log.info('redis multi exec done');
         }
      });
   },
   generateKeyDuoTask: function (field, secret) {
      var instance = this;
      return function (callback) {
         instance.generateKeyDuo(field, secret, callback);
      };
   },
   generateKeyDuo: function (field, secret, callback) {
      var instance = this;
      instance.log.info('generateKeyDuo', field, secret);
      cryptoUtils.pbkdf2(secret, this.salt, function (err, dek) {
         if (err) {
            instance.log.error('pbkdf2 error', field, err);
            callback(err);
         } else {
            var cipher = cryptoUtils.createCipheriv(dek, instance.iv);
            var encryptedSecret = cryptoUtils.encrypt(cipher, secret);
            var decipher = cryptoUtils.createDecipheriv(dek, instance.iv);
            var decryptedSecret = cryptoUtils.decrypt(decipher, encryptedSecret);
            instance.fields[field] = encryptedSecret;
            instance.log.info('pbkdf2 done', Object.keys(instance.fields).length, field, dek.length, encryptedSecret.length, decryptedSecret);
            callback();
         }
      });
   },
   generateKeyUsers: function (done) {
      var instance = this;
      instance.log.info('generateKeyUsers', instance.users, instance.salt.length, instance.iv.length);
      var tasks = [];
      for (var i = 0; i < instance.users.length; i++) {
         for (var j = 0; j < instance.users.length; j++) {
            if (j > i) {
               var field = ['secret', instance.users[i], instance.users[j]].join(':');
               var secret = instance.secrets[instance.users[i]] + ':' + instance.secrets[instance.users[j]];
               tasks.push(instance.generateKeyDuoTask(field, secret));
            }
         }
      }
      async.parallel(tasks, function (err, results) {
         if (err) {
            instance.log.info('generateKeyUsers error', err);
            done(err);
         } else {
            done();
         }
      });
   },
   generate: function (done) {
      var instance = this;
      cryptoUtils.generateSalt(function (err, salt) {
         if (err) {
            instance.log.error('salt error', err);
         } else {
            instance.salt = salt;
            cryptoUtils.generateIv(function (err, iv) {
               if (err) {
                  instance.log.error('iv error', err);
               } else {
                  instance.iv = iv;
                  instance.generateKeyUsers(done);
               }
            });
         }
      });

   },
   perform: function (done) {
      var instance = this;
      instance.log.info('generateKey');
      try {
         cryptoUtils.generateKey(function (err, generatedKey) {
            if (err) {
               instance.log.info('generateKey error', instance.users);
            } else {
               instance.log.info('generateKey done', instance.users, instance.redisKey, generatedKey.length);
               global.keyserver.redisClient.exists(instance.redisKey, function (err, exists) {
                  if (err) {
                     instance.log.error('redis error', err);
                     done(err);
                  } else if (exists) {
                     err = 'already exists';
                     done(err);
                  } else {
                     instance.log.info('generateKey', instance.redisKey);
                     instance.generate(function (err) {
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
         instance.log.error('generateKey', error);
      }
   }
};

module.exports = GenerateKey;
