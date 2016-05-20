'use strict';

var _exports;

var _assert2 = require('assert');

var _assert3 = _interopRequireDefault(_assert2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function format(type, options) {
   return type + ': ' + options.toString();
}

exports = (_exports = {
   assert: function assert(value, name) {
      (0, _assert3.default)(value, name);
      return value;
   },
   assertString: function assertString(value, name) {
      (0, _assert3.default)(value, name);
      (0, _assert3.default)(typeof value === 'string', name);
      return value;
   }
}, _defineProperty(_exports, 'assertString', function assertString(value, name) {
   (0, _assert3.default)(value, name);
   (0, _assert3.default)(typeof value === 'string', name);
   return value;
}), _defineProperty(_exports, 'assertInteger', function assertInteger(value, name) {
   (0, _assert3.default)(value, name);
   (0, _assert3.default)(parseInt(value) === value, name);
   return value;
}), _defineProperty(_exports, 'assertIntegerMax', function assertIntegerMax(value, name, max) {
   if (!max) {
      max = Invariants.props[name].max;
   }
   (0, _assert3.default)(value, { name: name, value: value });
   (0, _assert3.default)(Number.isInteger(value), format('integer', { name: name, value: value }));
   (0, _assert3.default)(value <= max, format('max', { name: name, value: value, max: max }));
   return value;
}), _defineProperty(_exports, 'assertIntegerMin', function assertIntegerMin(value, name, min) {
   if (!min) {
      min = Invariants.props[name].min;
   }
   (0, _assert3.default)(value, { name: name, value: value });
   (0, _assert3.default)(Number.isInteger(value), format('integer', { name: name, value: value }));
   (0, _assert3.default)(value >= min, format('min', { name: name, value: value, min: min }));
   return value;
}), _defineProperty(_exports, 'assertStringArray', function assertStringArray(value, name) {
   Asserts.assertArray(value, name);
   value.forEach(function (item) {
      Asserts.assertString(item, name);
   });
   return value;
}), _defineProperty(_exports, 'assertArray', function assertArray(value, name) {
   (0, _assert3.default)(value, name);
   (0, _assert3.default)(lodash.isArray(value), 'not array: ' + name);
   (0, _assert3.default)(!lodash.isEmpty(value), 'empty: ' + name);
   return value;
}), _exports);
//# sourceMappingURL=Asserts.js.map