
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver"});
var now = require('performance-now');

module.exports = {
   createReplyLogger: function () {
      var message = Array.prototype.slice.call(arguments).join(' ');
      return function (err, reply) {
         if (err) {
            log.warn(message, err);
         } else {
            log.info(message, reply);
         }
      };
   },
   callbackTimer: function (name, callback) {
      var start = now();
      return function (err, result) {
         var duration = Math.round(now() - start);
         log.info(name, duration);
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

