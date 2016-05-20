
const bunyan = require('bunyan');
const now = require('performance-now');

var logger = bunyan.createLogger({name: "cryptoserver"});

class Common {

   createReplyLogger() {
      var message = Array.prototype.slice.call(arguments).join(' ');
      return function (err, reply) {
         if (err) {
            logger.warn(message, err);
         } else {
            logger.info(message, reply);
         }
      };
   }

   callbackTimer(name, callback) {
      var start = now();
      return function (err, result) {
         var duration = Math.round(now() - start);
         logger.info(name, duration);
         callback(err, result);
      };
   }

   countdownLatch(counter, done) {
      return function () {
         if (counter > 0) {
            counter--;
         }
         if (counter === 0) {
            done();
         }
      };
   }
};

module.exports = new Common();
