
var commonFunctions = require('./commonFunctions');
var cryptoFunctions = require('./cryptoFunctions');
var async = require('async');
var bunyan = require('bunyan');
var bufferEquals = require('buffer-equal');

function GenerateKey(cryptoserver, keySecrets) {
   this.cryptoserver = cryptoserver;
   this.keyName = keySecrets.keyName;
   this.redisKey = 'dek:' + keySecrets.keyName;
   this.secrets = keySecrets.secrets;
   this.users = Object.keys(keySecrets.secrets);
   this.users.sort();
   this.log = bunyan.createLogger({name: 'cryptoserver.generateKey.' + this.keyName, level: 'debug'});
   this.encryptedItems = [];
}

GenerateKey.prototype = {
   save: function () {
      var that = this;
      var multi = that.cryptoserver.redisClient.multi();
      multi.hset(that.redisKey, 'salt', that.salt.toString('base64'));
      multi.hset(that.redisKey, 'iv', that.iv.toString('base64'));
      that.log.info('redis multi exec', that.encryptedItems.length);
      that.encryptedItems.forEach(function (encryptedItem) {
         var redisField = 'dek:' + encryptedItem.duo.join(':');
         multi.hset(that.redisKey, redisField, encryptedItem.encryptedDek.toString('base64'));
         that.log.debug('hset', redisField);
      });
      multi.exec(function (err, replies) {
         if (err) {
            that.log.error('redis multi exec error', err);
         } else {
            that.log.info('redis multi exec done', replies.length);
         }
      });
   },
   encryptDuoKek: function (duo, kek) {
      var that = this;
      var cipher = cryptoFunctions.createCipheriv(kek, that.iv);
      var encryptedDek = cryptoFunctions.encryptBuffer(cipher, that.generatedDek);
      that.encryptedItems.push({
         duo: duo,
         encryptedDek: encryptedDek
      });
      var decipher = cryptoFunctions.createDecipheriv(kek, that.iv);
      var decryptedDek = cryptoFunctions.decryptBuffer(decipher, encryptedDek);
      that.log.debug('decryptedDek', duo, decryptedDek.length, that.generatedDek.length);
      if (!bufferEquals(decryptedDek, that.generatedDek)) {
         throw {message: 'encryption verification failed'};
      }
      that.log.info('verified', duo, Object.keys(that.encryptedItems).length);
   },
   encryptDuo: function (duo, clearSecret, callback) {
      var that = this;
      that.log.debug('encryptDuo', duo);
      cryptoFunctions.pbkdf2(clearSecret, that.salt, function (err, kek) {
         if (err) {
            that.log.error('pbkdf2 error', duo, err);
            callback(err);
         } else {
            that.encryptDuoKek(duo, kek);
            callback();
         }
      });
   },
   encrytDuoTask: function (duo, secret) {
      var that = this;
      return function (callback) {
         that.encryptDuo(duo, secret, callback);
      };
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
               that.log.info('generateKeyUsers duo', duo);
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
   generateKey: function (done) {
      var that = this;
      cryptoFunctions.randomKey(function (err, generatedDek) {
         if (err) {
            that.log.info('generateKey error', that.users);
            done(err);
         } else {
            that.generatedDek = generatedDek;
            that.log.debug('generatedDek', that.generatedDek.length);
            that.generateKeyUsers(done);
         }
      });
   },
   generate: function (done) {
      var that = this;
      async.parallel([
         function (callback) {
            cryptoFunctions.randomSalt(function (err, salt) {
               if (err) {
                  that.log.error('salt error', err);
                  callback(err);
               } else {
                  that.salt = salt;
                  that.log.info('salt', salt.length);
                  callback(null, salt);
               }
            })
         },
         function (callback) {
            cryptoFunctions.randomIv(function (err, iv) {
               if (err) {
                  that.log.error('iv error', err);
                  callback(err);
               } else {
                  that.log.info('iv', iv.length);
                  that.iv = iv;
                  callback(null, iv);
               }
            });
         }
      ], function (err) {
         if (err) {
            done(err);
         } else {
            that.generateKey(done);
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
