'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.promisify = promisify;
exports.map = map;
exports.delay = delay;
exports.timeout = timeout;
function promisify(fn) {
   return new Promise(function (resolve, reject) {
      fn(function (err, result) {
         if (err) {
            reject(err);
         } else {
            resolve(result);
         }
      });
   });
}

function map(values, fn) {
   return Promise.all(values.map(fn));
}

function delay(millis) {
   return new Promise(function (resolve, reject) {
      setTimeout(function () {
         resolve();
      }, millis);
   });
}

function timeout(timeout, reason, promise) {
   if (timeout) {
      return new Promise(function (resolve, reject) {
         logger.error('timeout', typeof promise === 'undefined' ? 'undefined' : _typeof(promise)); // TODO
         promise.then(resolve, reject);
         setTimeout(function () {
            reject(reason + ' (' + timeout + 'ms)');
         }, timeout);
      });
   } else {
      return promise;
   }
}
//# sourceMappingURL=Promises.js.map