'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _bluebird = require('bluebird');

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.create = create;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config = {
   errorLimit: 30
};

var Logger = function () {
   function Logger(options) {
      _classCallCheck(this, Logger);

      Object.assign(options, { level: global.loggerLevel });
      Object.assign(this, options);
      this.logger = bunyan.createLogger({ name: this.name, level: this.level });
      this.logger.info('create', global.loggerLevel, options);
   }

   _createClass(Logger, [{
      key: 'ndebug',
      value: function ndebug() {}
   }, {
      key: 'dwarn',
      value: function dwarn() {
         if (global.loggerLevel === 'debug') {
            var _logger;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
               args[_key] = arguments[_key];
            }

            (_logger = this.logger).warn.apply(_logger, ['DEBUG'].concat(args));
         }
      }
   }, {
      key: 'debug',
      value: function debug() {
         var _logger2;

         (_logger2 = this.logger).debug.apply(_logger2, arguments);
      }
   }, {
      key: 'info',
      value: function info() {
         var _logger3;

         (_logger3 = this.logger).info.apply(_logger3, arguments);
      }
   }, {
      key: 'warn',
      value: function warn() {
         var _logger4;

         (_logger4 = this.logger).warn.apply(_logger4, arguments);
      }
   }, {
      key: 'error',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee() {
            var _logger5;

            var now,
                loggingUrl,
                message,
                url,
                _args = arguments;
            return regeneratorRuntime.wrap(function _callee$(_context) {
               while (1) {
                  switch (_context.prev = _context.next) {
                     case 0:
                        (_logger5 = this.logger).error.apply(_logger5, _args);
                        now = new Date().getTime();

                        if (!(!this.errorTime || now - this.errorTime > config.errorLimit * 1000)) {
                           _context.next = 16;
                           break;
                        }

                        this.errorTime = now;
                        loggingUrl = global.loggingUrl;

                        if (!loggingUrl) {
                           _context.next = 16;
                           break;
                        }

                        message = JSON.stringify(this.map.apply(this, _args));
                        url = [loggingUrl, 'lpushtrim', message, 100].join('/');
                        _context.prev = 8;
                        _context.next = 11;
                        return Promises.request({ url: url, method: 'head' });

                     case 11:
                        _context.next = 16;
                        break;

                     case 13:
                        _context.prev = 13;
                        _context.t0 = _context['catch'](8);

                        logger.warn('remote', loggingUrl, _context.t0);

                     case 16:
                     case 'end':
                        return _context.stop();
                  }
               }
            }, _callee, this, [[8, 13]]);
         }));

         function error() {
            return ref.apply(this, arguments);
         }

         return error;
      }()
   }, {
      key: 'map',
      value: function map() {
         for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
         }

         return args.map(function (arg) {
            if (arg === undefined) {} else if (arg === null) {} else if (arg === '') {} else if (typeof arg === 'string') {} else if (typeof arg === 'number') {} else if (lodash.isArray(arg)) {} else if (arg.message) {
               arg = arg.message;
            } else if (arg.constructor) {
               if (arg.constructor.name) {
                  arg = '@' + arg.constructor.name;
               } else {
                  arg = '?object';
               }
            } else {
               arg = '?' + (typeof arg === 'undefined' ? 'undefined' : _typeof(arg));
            }
            return arg;
         });
      }
   }]);

   return Logger;
}();

function create(filename, level) {
   var name = filename;
   var nameMatch = filename.match(/([^\/\\]+)\.[a-z0-9]+/);
   if (nameMatch) {
      name = nameMatch[1];
   }
   return new Logger({ name: name, level: level });
};
//# sourceMappingURL=Loggers.js.map