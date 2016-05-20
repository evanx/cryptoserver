'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.mkdirp = mkdirp;
exports.stat = stat;
exports.existsFile = existsFile;
exports.readFile = readFile;
exports.writeFile = writeFile;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp2 = require('mkdirp');

var _mkdirp3 = _interopRequireDefault(_mkdirp2);

var _Promises = require('./Promises');

var Promises = _interopRequireWildcard(_Promises);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mkdirp(directory) {
   return Promises.promisify(function (callback) {
      (0, _mkdirp3.default)(directory, callback);
   });
}

function stat(file) {
   return Promises.promisify(function (callback) {
      return _fs2.default.stat(file, callback);
   });
}

function existsFile(file) {
   return stat(file).then(function (stats) {
      return stats.isFile();
   }).catch(function (err) {
      return false;
   });
}

function readFile(file) {
   return Promises.promisify(function (callback) {
      return _fs2.default.readFile(file, callback);
   });
}

function writeFile(file, content) {
   return Promises.promisify(function (callback) {
      return _fs2.default.writeFile(file, content, callback);
   });
}
//# sourceMappingURL=Files.js.map