
var crypto = require('crypto');
var async = require('async');
var now = require('performance-now');

var options = {
   saltLength: 32,
   ivLength: 16,
   iterationCount: 100000,
   algorithm: 'aes-256-ctr',
   keyLength: 32
};

var data = {
   password: 'password',
   clearText: '1234567812345678'
};

async.series([
   function (callback) {
      crypto.randomBytes(options.saltLength, function (err, buffer) {
         if (!err) {
            data.salt = buffer;
            console.log('salt', data.salt.length);
         }
         callback(err);
      })
   },
   function (callback) {
      crypto.randomBytes(options.ivLength, function (err, buffer) {
         if (!err) {
            data.iv = buffer;
            console.log('iv', data.iv.length);
         }
         callback(err);
      });
   },
   function (callback) {
      var start = now();
      crypto.pbkdf2(data.password, data.salt, options.iterationCount, options.keyLength, function (err, key) {
         if (!err) {
            data.key = key;
            var duration = Math.round(now() - start);
            console.log('key', duration, data.key.length);
         }
         callback(err);
      });
   },
   function (callback) {
      data.cipher = crypto.createCipheriv(options.algorithm, data.key, data.iv);
      callback();
   },
   function (callback) {
      data.decipher = crypto.createDecipheriv(options.algorithm, data.key, data.iv);
      callback();
   },
   function (callback) {
      console.log('encrypt', data.clearText.length);
      data.encryptedText = data.cipher.update(data.clearText, 'utf8', 'hex');
      data.encryptedText += data.cipher.final('hex');
      callback();
   },
   function (callback) {
      console.log('decrypt', data.encryptedText.length);
      data.clearText = data.decipher.update(data.encryptedText, 'hex', 'utf8');
      data.clearText += data.decipher.final('utf8');
      console.log('decrypted', data.clearText);
      callback();
   }
], function (err, results) {
   console.log('series', err);
   if (err) {
      throw err;
   }
});

