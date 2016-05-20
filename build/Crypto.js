'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('crypto');

var Common = require('./Common');

var Crypto = function () {
   function Crypto() {
      _classCallCheck(this, Crypto);

      this.options = {
         saltLength: 32,
         ivLength: 16,
         iterationCount: 100000,
         algorithm: 'aes-256-ctr',
         keyLength: 32
      };
   }

   _createClass(Crypto, [{
      key: 'randomKey',
      value: function randomKey(callback) {
         crypto.randomBytes(options.keyLength, callback);
      }
   }, {
      key: 'randomSalt',
      value: function randomSalt(callback) {
         crypto.randomBytes(options.saltLength, callback);
      }
   }, {
      key: 'randomIv',
      value: function randomIv(callback) {
         crypto.randomBytes(options.ivLength, callback);
      }
   }, {
      key: 'pbkdf2',
      value: function pbkdf2(secret, salt, callback) {
         crypto.pbkdf2(secret, salt, options.iterationCount, options.keyLength, Common.callbackTimer('pbkdf2 timer', callback));
      }
   }, {
      key: 'createCipheriv',
      value: function createCipheriv(key, iv) {
         return crypto.createCipheriv(options.algorithm, key, iv);
      }
   }, {
      key: 'createDecipheriv',
      value: function createDecipheriv(key, iv) {
         return crypto.createDecipheriv(options.algorithm, key, iv);
      }
   }, {
      key: 'encryptString',
      value: function encryptString(cipher, text) {
         return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      }
   }, {
      key: 'decryptString',
      value: function decryptString(decipher, encrypted) {
         return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
      }
   }, {
      key: 'encryptBuffer',
      value: function encryptBuffer(cipher, buffer) {
         return Buffer.concat([cipher.update(buffer), cipher.final()]);
      }
   }, {
      key: 'decryptBuffer',
      value: function decryptBuffer(decipher, encrypted) {
         return Buffer.concat([decipher.update(encrypted), decipher.final()]);
      }
   }]);

   return Crypto;
}();

module.exports = new Crypto();
//# sourceMappingURL=Crypto.js.map