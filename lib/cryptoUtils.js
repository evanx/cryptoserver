
var crypto = require('crypto');
var async = require('async');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "keyserver", level: 'debug'});
var commonUtils = require('./commonUtils');

function CryptoUtils() {
   this.options = {
      saltLength: 32,
      ivLength: 16,
      iterationCount: 100000,
      algorithm: 'aes-256-ctr',
      keyLength: 32
   };
   this.randomKey = function (callback) {
      crypto.randomBytes(this.options.keyLength, callback);
   };
   this.randomSalt = function (callback) {
      crypto.randomBytes(this.options.saltLength, callback);
   };
   this.randomIv = function (callback) {
      crypto.randomBytes(this.options.ivLength, callback);
   };
   this.pbkdf2 = function (secret, salt, callback) {
      crypto.pbkdf2(secret, salt, this.options.iterationCount, this.options.keyLength,
              commonUtils.callbackTimer('pbkdf2 timer', callback));
   };
   this.createCipheriv = function (key, iv) {
      return crypto.createCipheriv(this.options.algorithm, key, iv);
   };
   this.createDecipheriv = function (key, iv) {
      return crypto.createDecipheriv(this.options.algorithm, key, iv);
   };
   this.encrypt = function (cipher, clearText) {
      log.debug('encrypt', clearText.length);
      var encryptedText = cipher.update(clearText, 'utf8', 'hex');
      encryptedText += cipher.final('hex');
      log.debug('encryptedText', encryptedText);
      return encryptedText;
   };
   this.decrypt = function (decipher, encrypted) {
      log.debug('decrypt', encrypted.length);
      var decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      log.debug('decrypted', decrypted.length);
      return decrypted;
   };
}

var instance = new CryptoUtils();

module.exports = instance;

