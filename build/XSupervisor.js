'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _bluebird = require('bluebird');

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Supervisor = function () {
   function Supervisor() {
      _classCallCheck(this, Supervisor);
   }

   _createClass(Supervisor, [{
      key: 'init',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee() {
            var componentName, componentConfig, componentModule;
            return regeneratorRuntime.wrap(function _callee$(_context) {
               while (1) {
                  switch (_context.prev = _context.next) {
                     case 0:
                        logger.info('config.components', Object.keys(config.components));
                        _context.t0 = regeneratorRuntime.keys(config.components);

                     case 2:
                        if ((_context.t1 = _context.t0()).done) {
                           _context.next = 15;
                           break;
                        }

                        componentName = _context.t1.value;
                        componentConfig = config.components[componentName];

                        if (!componentConfig) {
                           _context.next = 12;
                           break;
                        }

                        componentModule = config.availableComponents[componentName];

                        assert(componentModule, 'componentModule: ' + componentName);
                        _context.next = 10;
                        return this.initComponent(componentName, componentModule, componentConfig);

                     case 10:
                        _context.next = 13;
                        break;

                     case 12:
                        logger.warn('config.component', componentName);

                     case 13:
                        _context.next = 2;
                        break;

                     case 15:
                        _context.next = 17;
                        return this.startComponents();

                     case 17:
                        _context.next = 19;
                        return this.scheduleComponents();

                     case 19:
                        logger.info('components', Object.keys(components));
                        logger.info('inited');

                     case 21:
                     case 'end':
                        return _context.stop();
                  }
               }
            }, _callee, this);
         }));

         function init() {
            return ref.apply(this, arguments);
         }

         return init;
      }()
   }, {
      key: 'initComponent',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2(componentName, componentModule, componentConfig) {
            var meta, errorKeys, componentState, componentClass, component;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
               while (1) {
                  switch (_context2.prev = _context2.next) {
                     case 0:
                        // TODO support external modules
                        assert(typeof componentName === 'string', 'component name');
                        logger.info('initComponent', componentName, componentModule, componentConfig);
                        meta = CsonFiles.readFileSync(componentModule + '.cson'); // TODO support external modules

                        componentConfig = Object.assign(Metas.getDefault(meta.config), componentConfig);
                        componentConfig = Object.assign(componentConfig, Metas.getEnv(meta.config, componentName, process.env));
                        logger.debug('config', componentName, meta.config, componentConfig);
                        errorKeys = Metas.getErrorKeys(meta.config, componentConfig);

                        if (!errorKeys.length) {
                           _context2.next = 9;
                           break;
                        }

                        throw new ValidationError('config: ' + errorKeys.join(' '));

                     case 9:
                        componentState = Object.assign({
                           config: componentConfig,
                           logger: Loggers.create(componentName, componentConfig.loggerLevel || config.loggerLevel),
                           supervisor: this,
                           components: components
                        }, meta.state);
                        _context2.next = 12;
                        return ClassPreprocessor.buildSync(componentModule + '.js', Object.keys(componentState));

                     case 12:
                        componentModule = _context2.sent;
                        componentClass = require('./' + componentModule).default; // TODO support external modules

                        component = new componentClass();

                        logger.info('initComponents state', componentName, Object.keys(componentState));
                        Object.assign(component, { name: componentName }, componentState);

                        if (!component.init) {
                           _context2.next = 21;
                           break;
                        }

                        assert(lodash.isFunction(component.init), 'init function: ' + componentName);
                        _context2.next = 21;
                        return component.init();

                     case 21:
                        initedComponents.push(component);
                        components[componentName] = component;
                        logger.info('initComponents components', componentName, Object.keys(components));

                     case 24:
                     case 'end':
                        return _context2.stop();
                  }
               }
            }, _callee2, this);
         }));

         function initComponent(_x, _x2, _x3) {
            return ref.apply(this, arguments);
         }

         return initComponent;
      }()
   }, {
      key: 'startComponents',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee3() {
            var _arr, _i, component;

            return regeneratorRuntime.wrap(function _callee3$(_context3) {
               while (1) {
                  switch (_context3.prev = _context3.next) {
                     case 0:
                        logger.info('startComponents', initedComponents.length);
                        _arr = [].concat(_toConsumableArray(initedComponents));
                        _i = 0;

                     case 3:
                        if (!(_i < _arr.length)) {
                           _context3.next = 13;
                           break;
                        }

                        component = _arr[_i];

                        if (!component.start) {
                           _context3.next = 10;
                           break;
                        }

                        assert(lodash.isFunction(component.start), 'start function: ' + component.name);
                        logger.debug('start', component.name);
                        _context3.next = 10;
                        return component.start();

                     case 10:
                        _i++;
                        _context3.next = 3;
                        break;

                     case 13:
                     case 'end':
                        return _context3.stop();
                  }
               }
            }, _callee3, this);
         }));

         function startComponents() {
            return ref.apply(this, arguments);
         }

         return startComponents;
      }()
   }, {
      key: 'scheduleComponents',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee4() {
            var _arr2, _i2, component;

            return regeneratorRuntime.wrap(function _callee4$(_context4) {
               while (1) {
                  switch (_context4.prev = _context4.next) {
                     case 0:
                        logger.debug('scheduleComponents length', Object.keys(components));
                        _arr2 = [].concat(_toConsumableArray(initedComponents));
                        for (_i2 = 0; _i2 < _arr2.length; _i2++) {
                           component = _arr2[_i2];

                           logger.debug('scheduleComponents component', component.name, Object.keys(component.config));
                           if (component.config.scheduledTimeout) {
                              this.scheduleComponentTimeout(component);
                           }
                           if (component.config.scheduledInterval) {
                              this.scheduleComponentInterval(component);
                           }
                        }

                     case 3:
                     case 'end':
                        return _context4.stop();
                  }
               }
            }, _callee4, this);
         }));

         function scheduleComponents() {
            return ref.apply(this, arguments);
         }

         return scheduleComponents;
      }()
   }, {
      key: 'scheduleComponentTimeout',
      value: function scheduleComponentTimeout(component) {
         var _this = this;

         assert(component.config.scheduledTimeout > 0, 'component.config.scheduledTimeout');
         assert(lodash.isFunction(component.scheduledTimeout), 'scheduledTimeout function: ' + component.name);
         this.scheduledTimeouts[component.name] = setTimeout((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee5() {
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
               while (1) {
                  switch (_context5.prev = _context5.next) {
                     case 0:
                        _context5.prev = 0;
                        _context5.next = 3;
                        return component.scheduledTimeout();

                     case 3:
                        _context5.next = 8;
                        break;

                     case 5:
                        _context5.prev = 5;
                        _context5.t0 = _context5['catch'](0);

                        if (component.config.scheduledTimeoutWarn) {
                           logger.warn(_context5.t0, component.name, component.config);
                        } else {
                           _this.error(_context5.t0, component);
                        }

                     case 8:
                     case 'end':
                        return _context5.stop();
                  }
               }
            }, _callee5, _this, [[0, 5]]);
         })), component.config.scheduledTimeout);
      }
   }, {
      key: 'scheduleComponentInterval',
      value: function scheduleComponentInterval(component) {
         var _this2 = this;

         assert(component.config.scheduledInterval > 0, 'component.config.scheduledInterval');
         assert(lodash.isFunction(component.scheduledInterval), 'scheduledInterval function: ' + component.name);
         this.scheduledIntervals[component.name] = setInterval((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee6() {
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
               while (1) {
                  switch (_context6.prev = _context6.next) {
                     case 0:
                        _context6.prev = 0;
                        _context6.next = 3;
                        return component.scheduledInterval();

                     case 3:
                        _context6.next = 8;
                        break;

                     case 5:
                        _context6.prev = 5;
                        _context6.t0 = _context6['catch'](0);

                        if (component.config.scheduledIntervalWarn) {
                           logger.warn(_context6.t0, component.name, component.config);
                        } else {
                           _this2.error(_context6.t0, component);
                        }

                     case 8:
                     case 'end':
                        return _context6.stop();
                  }
               }
            }, _callee6, _this2, [[0, 5]]);
         })), component.config.scheduledInterval);
      }
   }, {
      key: 'start',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee7() {
            var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, component;

            return regeneratorRuntime.wrap(function _callee7$(_context7) {
               while (1) {
                  switch (_context7.prev = _context7.next) {
                     case 0:
                        logger.info('start components', Object.keys(components));
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context7.prev = 4;
                        _iterator = components[Symbol.iterator]();

                     case 6:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                           _context7.next = 13;
                           break;
                        }

                        component = _step.value;
                        _context7.next = 10;
                        return component.start();

                     case 10:
                        _iteratorNormalCompletion = true;
                        _context7.next = 6;
                        break;

                     case 13:
                        _context7.next = 19;
                        break;

                     case 15:
                        _context7.prev = 15;
                        _context7.t0 = _context7['catch'](4);
                        _didIteratorError = true;
                        _iteratorError = _context7.t0;

                     case 19:
                        _context7.prev = 19;
                        _context7.prev = 20;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                           _iterator.return();
                        }

                     case 22:
                        _context7.prev = 22;

                        if (!_didIteratorError) {
                           _context7.next = 25;
                           break;
                        }

                        throw _iteratorError;

                     case 25:
                        return _context7.finish(22);

                     case 26:
                        return _context7.finish(19);

                     case 27:
                        logger.info('started');

                     case 28:
                     case 'end':
                        return _context7.stop();
                  }
               }
            }, _callee7, this, [[4, 15, 19, 27], [20,, 22, 26]]);
         }));

         function start() {
            return ref.apply(this, arguments);
         }

         return start;
      }()
   }, {
      key: 'error',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee8(err, component) {
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
               while (1) {
                  switch (_context8.prev = _context8.next) {
                     case 0:
                        if (ended) {
                           _context8.next = 10;
                           break;
                        }

                        logger.error(err, component.name);
                        if (err.stack) {
                           logger.error(err.stack);
                        }

                        if (!components.metrics) {
                           _context8.next = 7;
                           break;
                        }

                        if (!(components.metrics !== component)) {
                           _context8.next = 7;
                           break;
                        }

                        _context8.next = 7;
                        return components.metrics.count('error', component.name);

                     case 7:
                        this.end();
                        _context8.next = 11;
                        break;

                     case 10:
                        logger.warn(component.name, err);

                     case 11:
                     case 'end':
                        return _context8.stop();
                  }
               }
            }, _callee8, this);
         }));

         function error(_x4, _x5) {
            return ref.apply(this, arguments);
         }

         return error;
      }()
   }, {
      key: 'endComponents',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee9() {
            var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, component;

            return regeneratorRuntime.wrap(function _callee9$(_context9) {
               while (1) {
                  switch (_context9.prev = _context9.next) {
                     case 0:
                        if (!initedComponents.length) {
                           _context9.next = 35;
                           break;
                        }

                        initedComponents.reverse();
                        _iteratorNormalCompletion2 = true;
                        _didIteratorError2 = false;
                        _iteratorError2 = undefined;
                        _context9.prev = 5;
                        _iterator2 = initedComponents[Symbol.iterator]();

                     case 7:
                        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                           _context9.next = 21;
                           break;
                        }

                        component = _step2.value;
                        _context9.prev = 9;
                        _context9.next = 12;
                        return component.end();

                     case 12:
                        logger.info('end component', component.name);
                        _context9.next = 18;
                        break;

                     case 15:
                        _context9.prev = 15;
                        _context9.t0 = _context9['catch'](9);

                        logger.error('end component', component.name, _context9.t0.stack);

                     case 18:
                        _iteratorNormalCompletion2 = true;
                        _context9.next = 7;
                        break;

                     case 21:
                        _context9.next = 27;
                        break;

                     case 23:
                        _context9.prev = 23;
                        _context9.t1 = _context9['catch'](5);
                        _didIteratorError2 = true;
                        _iteratorError2 = _context9.t1;

                     case 27:
                        _context9.prev = 27;
                        _context9.prev = 28;

                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                           _iterator2.return();
                        }

                     case 30:
                        _context9.prev = 30;

                        if (!_didIteratorError2) {
                           _context9.next = 33;
                           break;
                        }

                        throw _iteratorError2;

                     case 33:
                        return _context9.finish(30);

                     case 34:
                        return _context9.finish(27);

                     case 35:
                     case 'end':
                        return _context9.stop();
                  }
               }
            }, _callee9, this, [[5, 23, 27, 35], [9, 15], [28,, 30, 34]]);
         }));

         function endComponents() {
            return ref.apply(this, arguments);
         }

         return endComponents;
      }()
   }, {
      key: 'end',
      value: function () {
         var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee10() {
            return regeneratorRuntime.wrap(function _callee10$(_context10) {
               while (1) {
                  switch (_context10.prev = _context10.next) {
                     case 0:
                        _context10.next = 2;
                        return this.endComponents();

                     case 2:
                        if (!this.redisClient) {
                           _context10.next = 5;
                           break;
                        }

                        _context10.next = 5;
                        return this.redisClient.quitAsync();

                     case 5:
                        process.exit(0);

                     case 6:
                     case 'end':
                        return _context10.stop();
                  }
               }
            }, _callee10, this);
         }));

         function end() {
            return ref.apply(this, arguments);
         }

         return end;
      }()
   }]);

   return Supervisor;
}();

exports.default = Supervisor;
//# sourceMappingURL=XSupervisor.js.map