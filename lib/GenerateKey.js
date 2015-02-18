
var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function GenerateKey(cryptoserver) {
   this.cryptoserver = cryptoserver;
   this.keyName = cryptoserver.data.keyName;
   this.redisKey = 'dek:' + cryptoserver.data.keyName;
   this.secrets = cryptoserver.data.secrets;
   this.users = Object.keys(cryptoserver.data.secrets);
   this.users.sort();
   this.log = cryptoserver.log.child({keyName: this.keyName});
   this.duoSecrets = [];
}

GenerateKey.prototype = {
   save: function () {
      var instance = this;
      var multi = global.cryptoserver.redisClient.multi();
      multi.hset(instance.redisKey, 'salt', instance.salt.toString('base64'));
      multi.hset(instance.redisKey, 'iv', instance.iv.toString('base64'));
      instance.log.info('redis multi exec', instance.duoSecrets.length);
      instance.duoSecrets.forEach(function (encryptedDuoSecret) {
         var redisField = 'dek:' + encryptedDuoSecret.duo.join(':');
         multi.hset(instance.redisKey, redisField, instance.duoSecrets.encryptedSecret);
         instance.log.debug('hset', redisField);
      });
      multi.exec(function (err, replies) {
         if (err) {
            instance.log.error('redis multi exec error', err);
         } else {
            instance.log.info('redis multi exec done');
         }
      });
   },
   encrytDuoTask: function (duo, secret) {
      var instance = this;
      return function (callback) {
         instance.encryptDuo(duo, secret, callback);
      };
   },
   encryptDuo: function (duo, clearSecret, callback) {
      var instance = this;
      instance.log.debug('encryptDuo', duo, clearSecret.length);
      cryptoUtils.pbkdf2(clearSecret, this.salt, function (err, kek) {
         if (err) {
            instance.log.error('pbkdf2 error', duo, err);
            callback(err);
         } else {
            instance.log.error('generatedDek', instance.generatedDek.length);
            var cipher = cryptoUtils.createCipheriv(kek, instance.iv);
            var encryptedDek = cryptoUtils.encrypt(cipher, instance.generatedDek);
            var decipher = cryptoUtils.createDecipheriv(kek, instance.iv);
            var decryptedDek = cryptoUtils.decrypt(decipher, encryptedDek);
            instance.log.error('decryptedDek', decryptedDek.length);
            if (decryptedDek.length !== instance.generatedDek.length) {
               throw {message: 'encryption verification failed'};
            }
            instance.duoSecrets.push({
               duo: duo,
               encryptedSecret: encryptedDek
            });
            instance.log.info('pbkdf2 done', Object.keys(instance.duoSecrets).length, duo,
                    typeof kek, kek.length, encryptedDek.length, decryptedDek.length);
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
               var duo = [instance.users[i], instance.users[j]];
               var clearSecret = instance.secrets[duo[0]] + ':' + instance.secrets[duo[1]];
               tasks.push(instance.encrytDuoTask(duo, clearSecret));
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
      cryptoUtils.randomSalt(function (err, salt) {
         if (err) {
            instance.log.error('salt error', err);
         } else {
            instance.salt = salt;
            cryptoUtils.randomIv(function (err, iv) {
               if (err) {
                  instance.log.error('iv error', err);
               } else {
                  instance.iv = iv;
                  cryptoUtils.randomKey(function (err, generatedDek) {
                     if (err) {
                        instance.log.info('generateKey error', instance.users);
                     } else {
                        instance.generatedDek = generatedDek;
                        instance.generateKeyUsers(done);
                     }
                  });
               }
            });
         }
      });
   },
   perform: function (done) {
      var instance = this;
      instance.log.info('generateKey');
      try {
         instance.log.info('generateKey done', instance.users, instance.redisKey);
         global.cryptoserver.redisClient.exists(instance.redisKey, function (err, exists) {
            if (err) {
               instance.log.error('redis error', err);
               done(err);
            } else if (exists) {
               err = 'already exists';
               done(err);
            } else {
               instance.log.info('generate', instance.redisKey);
               instance.generate(function (err) {
                  if (err) {
                     done(err);
                  } else {
                     instance.save();
                     done();
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
