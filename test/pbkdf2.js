
var crypto = require('crypto');
var async = require('async');

var data = {
   saltLength: 32,
   ivLength: 16,
   iterationCount: 10000,
   algorithm: 'aes-256-ctr',
   keyLength: 32,
   password: 'password',
   clearText: '1234567812345678'
};

async.series([
   function (callback) {
      crypto.randomBytes(data.saltLength, function (err, buffer) {
         if (!err) {
            data.salt = buffer;
            console.log('salt', data.salt.length);
         }
         callback(err);
      })
   },
   function (callback) {
      crypto.randomBytes(data.ivLength, function (err, buffer) {
         if (!err) {
            data.iv = buffer;
            console.log('iv', data.iv.length);
         }
         callback(err);
      });
   },
   function (callback) {
      crypto.pbkdf2(data.password, data.salt, data.iterationCount, data.keyLength, function (err, key) {
         if (!err) {
            data.key = key;
            console.log('key', data.key.length);
         }
         callback(err);
      });
   },
   function (callback) {
      data.cipher = crypto.createCipheriv(data.algorithm, data.key, data.iv);
      callback();
   },
   function (callback) {
      data.decipher = crypto.createDecipheriv(data.algorithm, data.key, data.iv);
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

