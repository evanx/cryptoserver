
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
   this.generateKey = function (callback) {
      crypto.randomBytes(this.options.keyLength, callback);
   };
   this.generateSalt = function (callback) {
      crypto.randomBytes(this.options.saltLength, callback);
   };
   this.generateIv = function (callback) {
      crypto.randomBytes(this.options.ivLength, callback);
   };
   this.pbkdf2 = function (secret, salt, callback) {
      crypto.pbkdf2(secret, salt, this.options.iterationCount, this.options.keyLength, commonUtils.callbackTimer('pbkdf2 timer', callback));
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
      log.debug('encrypted', encryptedText);
      return encryptedText;
   };
   this.decrypt = function (decipher, encrypted) {
      log.debug('decrypt', encrypted.length);
      var clearText = decipher.update(encrypted, 'hex', 'utf8');
      clearText += decipher.final('utf8');
      log.debug('decrypted', clearText);
      return clearText;
   };
}

module.exports = new CryptoUtils();
