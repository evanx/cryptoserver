
var crypto = require('crypto');

var Common = require('./Common');

function create() {
   var that = {};
   var options = {
      saltLength: 32,
      ivLength: 16,
      iterationCount: 100000,
      algorithm: 'aes-256-ctr',
      keyLength: 32
   };
   that.options = options;
   that.randomKey = function (callback) {
      crypto.randomBytes(options.keyLength, callback);
   };
   that.randomSalt = function (callback) {
      crypto.randomBytes(options.saltLength, callback);
   };
   that.randomIv = function (callback) {
      crypto.randomBytes(options.ivLength, callback);
   };
   that.pbkdf2 = function (secret, salt, callback) {
      crypto.pbkdf2(secret, salt, options.iterationCount, options.keyLength,
              Common.callbackTimer('pbkdf2 timer', callback));
   };
   that.createCipheriv = function (key, iv) {
      return crypto.createCipheriv(options.algorithm, key, iv);
   };
   that.createDecipheriv = function (key, iv) {
      return crypto.createDecipheriv(options.algorithm, key, iv);
   };
   that.encryptString = function (cipher, text) {
      return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
   };
   that.decryptString = function (decipher, encrypted) {
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
   };
   that.encryptBuffer = function (cipher, buffer) {
      return Buffer.concat([cipher.update(buffer), cipher.final()]);
   };
   that.decryptBuffer = function (decipher, encrypted) {
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
   };
   return that;
}


module.exports = create();
