
var bunyan = require('bunyan');
var now = require('performance-now');

var logger = bunyan.createLogger({name: "cryptoserver"});

module.exports = {
   createReplyLogger: function () {
      var message = Array.prototype.slice.call(arguments).join(' ');
      return function (err, reply) {
         if (err) {
            logger.warn(message, err);
         } else {
            logger.info(message, reply);
         }
      };
   },
   callbackTimer: function (name, callback) {
      var start = now();
      return function (err, result) {
         var duration = Math.round(now() - start);
         logger.info(name, duration);
         callback(err, result);
      };
   },
   countdownLatch: function (counter, done) {
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
