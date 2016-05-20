'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.head = exports.content = undefined;

var _bluebird = require('bluebird');

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); // Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redexutil/LICENSE

var content = exports.content = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee(options) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
         while (1) {
            switch (_context.prev = _context.next) {
               case 0:
                  return _context.abrupt('return', contentOptions(processOptions(options)));

               case 1:
               case 'end':
                  return _context.stop();
            }
         }
      }, _callee, this);
   }));
   return function content(_x) {
      return ref.apply(this, arguments);
   };
}();

var contentOptions = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2(options) {
      var _ref, _ref2, response, content;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
         while (1) {
            switch (_context2.prev = _context2.next) {
               case 0:
                  _context2.next = 2;
                  return createPromise(options);

               case 2:
                  _ref = _context2.sent;
                  _ref2 = _slicedToArray(_ref, 2);
                  response = _ref2[0];
                  content = _ref2[1];

                  if (!(response.statusCode !== 200)) {
                     _context2.next = 8;
                     break;
                  }

                  throw { options: options, statusCode: response.statusCode };

               case 8:
                  return _context2.abrupt('return', content);

               case 9:
               case 'end':
                  return _context2.stop();
            }
         }
      }, _callee2, this);
   }));
   return function contentOptions(_x2) {
      return ref.apply(this, arguments);
   };
}();

var head = exports.head = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee3(options) {
      var _ref3, _ref4, response;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
         while (1) {
            switch (_context3.prev = _context3.next) {
               case 0:
                  _context3.next = 2;
                  return createPromise(options);

               case 2:
                  _ref3 = _context3.sent;
                  _ref4 = _slicedToArray(_ref3, 1);
                  response = _ref4[0];
                  return _context3.abrupt('return', response);

               case 6:
               case 'end':
                  return _context3.stop();
            }
         }
      }, _callee3, this);
   }));
   return function head(_x3) {
      return ref.apply(this, arguments);
   };
}();

exports.json = json;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = Loggers.create(__filename, 'debug');

function statusCode(err, response) {
   return err || response.statusCode;
}

function createPromise(options) {
   var startTime = new Date().getTime();
   return new Promise(function (resolve, reject) {
      (0, _request2.default)(options, function (err, response, content) {
         var duration = Millis.getElapsedDuration(startTime);
         if (duration > options.slow) {
            logger.warn('request slow', options.url, statusCode(err, response), Millis.formatDuration(duration));
         } else {
            logger.debug('response', options, statusCode(err, response), Millis.formatDuration(duration));
         }
         if (err) {
            err.options = options;
            err.duration = duration;
            reject(err);
         } else if (response.statusCode === 200) {
            resolve([response, content]);
         } else {
            resolve([response]);
         }
      });
   });
}

function json(options) {
   return contentOptions(processOptions(options), { json: true });
}

function processOptions(options, assign) {
   if (typeof options === 'string') {
      options = { url: options, slow: 8000 };
   } else if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
      assert(options.url, 'url');
      options.headers = options.headers || {};
      if (options.lastModified) {
         Object.assign(options.headers, { 'If-Modified-Since': options.lastModified });
      }
      if (options.username && options.password) {
         var auth = 'Basic ' + new Buffer(options.username + ':' + options.password).toString('base64');
         Object.assign(options.headers, { 'Authorization': auth });
      }
      if (!options.slow) {
         options.slow = 8000;
      }
   } else {
      throw { message: 'Invalid request options' };
   }
   if (assign) {
      return Object.assign(options, assign);
   }
   return options;
}
//# sourceMappingURL=Requests.js.map