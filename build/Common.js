'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var bunyan = require('bunyan');
var now = require('performance-now');

var logger = bunyan.createLogger({ name: "cryptoserver" });

var Common = function () {
   function Common() {
      _classCallCheck(this, Common);
   }

   _createClass(Common, [{
      key: 'createReplyLogger',
      value: function createReplyLogger() {
         var message = Array.prototype.slice.call(arguments).join(' ');
         return function (err, reply) {
            if (err) {
               logger.warn(message, err);
            } else {
               logger.info(message, reply);
            }
         };
      }
   }, {
      key: 'callbackTimer',
      value: function callbackTimer(name, callback) {
         var start = now();
         return function (err, result) {
            var duration = Math.round(now() - start);
            logger.info(name, duration);
            callback(err, result);
         };
      }
   }, {
      key: 'countdownLatch',
      value: function countdownLatch(counter, done) {
         return function () {
            if (counter > 0) {
               counter--;
            }
            if (counter === 0) {
               done();
            }
         };
      }
   }]);

   return Common;
}();

;

module.exports = new Common();
//# sourceMappingURL=Common.js.map