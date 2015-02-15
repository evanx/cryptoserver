

var commonUtils = require('./commonUtils');
var cryptoUtils = require('./cryptoUtils');
var async = require('async');

function LoadKey(keyserver) {
   this.keyserver = keyserver;
   this.keyName = keyserver.data.keyName;
   this.redisKey = 'dek:' + keyserver.data.keyName;
   this.secrets = keyserver.data.secrets;
   this.users = Object.keys(keyserver.data.secrets);
   this.users.sort();
   this.log = keyserver.instance.log.child({keyName: this.keyName});
   this.fields = {};
}

LoadKey.prototype = {
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
   loadKeyDuoTask: function (field, secret) {
      var instance = this;
      return function (callback) {
         instance.loadKeyDuo(field, secret, callback);
      };
   },
   loadKeyDuo: function (field, secret, callback) {
      var instance = this;
      instance.log.info('loadKeyDuo', field, secret);
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
   loadKeyUsers: function (done) {
      var instance = this;
      instance.log.info('loadKeyUsers', instance.users, instance.salt.length, instance.iv.length);
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
            instance.log.info('loadKeyUsers error', err);
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
            instance.log.error('salt error', err);
         } else {
            instance.salt = salt;
            cryptoUtils.loadIv(function (err, iv) {
               if (err) {
                  instance.log.error('iv error', err);
               } else {
                  instance.iv = iv;
                  instance.loadKeyUsers(done);
               }
            });
         }
      });

   },
   processReply: function (reply) {
      var instance = this;
      instance.log.info('processKey reply', Object.keys(reply));
      instance.salt = reply.salt;
      instance.iv = reply.iv;
      for (var field in reply) {
         if (field.indexOf('dek:') === 0) {
            var users = field.split(':').slice(1);
            instance.log.info('dek', field, users, instance.secrets[users[0]], instance.secrets[users[1]]);
         }
      }
   },
   hgetall: function () {
      var instance = this;
      global.keyserver.redisClient.hgetall(instance.redisKey, function (err, reply) {
         if (err) {
            instance.log.error('getValues error');
         } else {
            instance.processReply(reply);
         }
      });
   },
   perform: function (done) {
      var instance = this;
      instance.log.info('loadKey');
      try {
         instance.hgetall();
      } catch (error) {
         instance.log.error('loadKey', error);
      }
   }
};

module.exports = LoadKey;
