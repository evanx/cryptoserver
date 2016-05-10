
const crypto = require('crypto');

const Common = require('./Common');

class Crypto {

   options = {
      saltLength: 32,
      ivLength: 16,
      iterationCount: 100000,
      algorithm: 'aes-256-ctr',
      keyLength: 32
   }

   randomKey(callback) {
      crypto.randomBytes(options.keyLength, callback);
   }

   randomSalt(callback) {
      crypto.randomBytes(options.saltLength, callback);
   }

   randomIv(callback) {
      crypto.randomBytes(options.ivLength, callback);
   }

   pbkdf2(secret, salt, callback) {
      crypto.pbkdf2(secret, salt, options.iterationCount, options.keyLength,
         Common.callbackTimer('pbkdf2 timer', callback)
      );
   }

   createCipheriv(key, iv) {
      return crypto.createCipheriv(options.algorithm, key, iv);
   }

   createDecipheriv(key, iv) {
      return crypto.createDecipheriv(options.algorithm, key, iv);
   }

   encryptString(cipher, text) {
      return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
   }

   decryptString(decipher, encrypted) {
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
   }

   encryptBuffer(cipher, buffer) {
      return Buffer.concat([cipher.update(buffer), cipher.final()]);
   }

   decryptBuffer(decipher, encrypted) {
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
   }
}


module.exports = new Crypto();
