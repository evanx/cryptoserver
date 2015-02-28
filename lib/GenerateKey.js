
var commonFunctions = require('./commonFunctions');
var cryptoFunctions = require('./cryptoFunctions');
var async = require('async');
var bunyan = require('bunyan');

function GenerateKey(cryptoserver, keySecrets) {
   this.cryptoserver = cryptoserver;
   this.keyName = keySecrets.keyName;
   this.redisKey = 'dek:' + keySecrets.keyName;
   this.secrets = keySecrets.secrets;
   this.users = Object.keys(keySecrets.secrets);
   this.users.sort();
   this.log = bunyan.createLogger({name: 'cryptoserver.generateKey.' + this.keyName});
   this.duoSecrets = [];
}

GenerateKey.prototype = {
   save: function () {
      var that = this;
      var multi = that.cryptoserver.redisClient.multi();
      multi.hset(that.redisKey, 'salt', that.salt.toString('base64'));
      multi.hset(that.redisKey, 'iv', that.iv.toString('base64'));
      that.log.info('redis multi exec', that.duoSecrets.length);
      that.duoSecrets.forEach(function (encryptedDuoSecret) {
         var redisField = 'dek:' + encryptedDuoSecret.duo.join(':');
         multi.hset(that.redisKey, redisField, that.duoSecrets.encryptedSecret);
         that.log.debug('hset', redisField);
      });
      multi.exec(function (err, replies) {
         if (err) {
            that.log.error('redis multi exec error', err);
         } else {
            that.log.info('redis multi exec done');
         }
      });
   },
   encrytDuoTask: function (duo, secret) {
      var that = this;
      return function (callback) {
         that.encryptDuo(duo, secret, callback);
      };
   },
   encryptDuo: function (duo, clearSecret, callback) {
      var that = this;
      that.log.debug('encryptDuo', duo, clearSecret.length);
      cryptoFunctions.pbkdf2(clearSecret, that.salt, function (err, kek) {
         if (err) {
            that.log.error('pbkdf2 error', duo, err);
            callback(err);
         } else {
            that.log.debug('generatedDek', that.generatedDek.length);
            var cipher = cryptoFunctions.createCipheriv(kek, that.iv);
            var encryptedDek = cryptoFunctions.encrypt(cipher, that.generatedDek);
            var decipher = cryptoFunctions.createDecipheriv(kek, that.iv);
            var decryptedDek = cryptoFunctions.decrypt(decipher, encryptedDek);
            that.log.debug('decryptedDek', decryptedDek.length);
            if (decryptedDek.length !== that.generatedDek.length) {
               throw {message: 'encryption verification failed'};
            }
            that.duoSecrets.push({
               duo: duo,
               encryptedSecret: encryptedDek
            });
            that.log.info('pbkdf2 done', Object.keys(that.duoSecrets).length, duo,
                    typeof kek, kek.length, encryptedDek.length, decryptedDek.length);
            callback();
         }
      });
   },
   generateKeyUsers: function (done) {
      var that = this;
      that.log.info('generateKeyUsers', that.users, that.salt.length, that.iv.length);
      var tasks = [];
      for (var i = 0; i < that.users.length; i++) {
         for (var j = 0; j < that.users.length; j++) {
            if (j > i) {
               var duo = [that.users[i], that.users[j]];
               var clearSecret = that.secrets[duo[0]] + ':' + that.secrets[duo[1]];
               tasks.push(that.encrytDuoTask(duo, clearSecret));
            }
         }
      }
      async.parallel(tasks, function (err, results) {
         if (err) {
            that.log.info('generateKeyUsers error', err);
            done(err);
         } else {
            done();
         }
      });
   },
   generate: function (done) {
      var that = this;
      cryptoFunctions.randomSalt(function (err, salt) {
         if (err) {
            that.log.error('salt error', err);
         } else {
            that.salt = salt;
            cryptoFunctions.randomIv(function (err, iv) {
               if (err) {
                  that.log.error('iv error', err);
               } else {
                  that.iv = iv;
                  cryptoFunctions.randomKey(function (err, generatedDek) {
                     if (err) {
                        that.log.info('generateKey error', that.users);
                     } else {
                        that.generatedDek = generatedDek;
                        that.generateKeyUsers(done);
                     }
                  });
               }
            });
         }
      });
   },
   perform: function (done) {
      var that = this;
      that.log.info('generateKey');
      try {
         that.log.info('generateKey done', that.users, that.redisKey);
         that.cryptoserver.redisClient.exists(that.redisKey, function (err, exists) {
            if (err) {
               that.log.error('redis error', err);
               done(err);
            } else if (exists) {
               err = 'already exists';
               done(err);
            } else {
               that.log.info('generate', that.redisKey);
               that.generate(function (err) {
                  if (err) {
                     done(err);
                  } else {
                     that.save();
                     done();
                  }
               });
            }
         });
      } catch (error) {
         that.log.error('generateKey', error);
      }
   }
};

module.exports = GenerateKey;
