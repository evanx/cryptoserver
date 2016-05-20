'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.isDefined = isDefined;
exports.filterKeys = filterKeys;

var logger = Loggers.create(__filename, 'info');

function isDefined(value) {
   return value !== undefined;
}

function filterKeys(object, other, fn) {
   return Object.keys(object).filter(function (key) {
      return fn(key, object[key], other[key]);
   });
}
//# sourceMappingURL=Values.js.map