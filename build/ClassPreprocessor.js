'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.buildSync = undefined;

var _bluebird = require('bluebird');

var buildSync = exports.buildSync = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee(sourceFile, names) {
      var buildDir, targetFile, sourceCode, regex, replace, translatedCode, loggerLine;
      return regeneratorRuntime.wrap(function _callee$(_context) {
         while (1) {
            switch (_context.prev = _context.next) {
               case 0:
                  // regex this dereferencing on names
                  logger.debug('buildSync', sourceFile);

                  if (/^\.\//.test(sourceFile)) {
                     _context.next = 3;
                     break;
                  }

                  throw 'unsupported: ' + sourceFile;

               case 3:
                  buildDir = './build/';
                  _context.next = 6;
                  return Files.mkdirp(buildDir);

               case 6:
                  targetFile = sourceFile.replace(/^(\.\/[a-z]*)\//, buildDir);

                  sourceFile = sourceFile.replace(/^./, module.filename.replace(/\/lib\/\w*\.js/, ''));
                  if (!/\.js$/.test(sourceFile)) {
                     sourceFile = sourceFile + '.js';
                  }
                  sourceCode = _fs2.default.readFileSync(sourceFile).toString();
                  regex = '([^a-z\\.\'])(' + names.join('|') + ')([^-A-Za-z:\'])';
                  replace = '$1this.$2$3';

                  logger.debug('regex', regex, replace);
                  translatedCode = sourceCode.replace(new RegExp(regex, 'g'), replace);
                  loggerLine = false;

                  translatedCode = translatedCode.split('\n').map(function (line, index) {
                     if (/^\s+this\.logger/.test(line)) {
                        loggerLine = true;
                     } else if (false && loggerLine && /\)\s+{\s*$/.test(line)) {
                        return line + ('\nthis.logger.debug(\'line\', ' + (index + 1) + ');');
                     }
                     var translatedLine = line.replace(/\$lineNumber/, '\'line:' + (index + 1) + '\'');
                     logger.ndebug('line', index, translatedLine);
                     return translatedLine;
                  }).join('\n');
                  logger.ndebug('source', translatedCode);
                  _fs2.default.writeFileSync(targetFile, translatedCode);
                  logger.debug('targetFile', targetFile);
                  return _context.abrupt('return', targetFile);

               case 20:
               case 'end':
                  return _context.stop();
            }
         }
      }, _callee, this);
   }));
   return function buildSync(_x, _x2) {
      return ref.apply(this, arguments);
   };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Files = require('./Files');

var Files = _interopRequireWildcard(_Files);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = Loggers.create(module.filename, 'info');
//# sourceMappingURL=ClassPreprocessor.js.map