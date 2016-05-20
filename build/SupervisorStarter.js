'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.startSupervisor = undefined;

var _bluebird = require('bluebird');

// supervisor instance

var createSupervisor = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee(supervisorMeta) {
      var Supervisor;
      return regeneratorRuntime.wrap(function _callee$(_context) {
         while (1) {
            switch (_context.prev = _context.next) {
               case 0:
                  logger.debug('createSupervisor', supervisorMeta);

                  if (!/\Wicp\W/.test(supervisorMeta.spec)) {
                     _context.next = 5;
                     break;
                  }

                  // TODO babel class transform, rather than fragile regex transformation
                  logger.debug('createSupervisor', supervisorMeta.spec);
                  _context.next = 5;
                  return ClassPreprocessor.buildSync('./lib/Supervisor.js', ['logger', 'context', 'config'].concat(Object.keys(supervisorMeta.state)));

               case 5:
                  Supervisor = require('../build/Supervisor').default;
                  return _context.abrupt('return', new Supervisor());

               case 7:
               case 'end':
                  return _context.stop();
            }
         }
      }, _callee, this);
   }));
   return function createSupervisor(_x) {
      return ref.apply(this, arguments);
   };
}();

var startSupervisor = exports.startSupervisor = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2() {
      var supervisorMeta, supervisor;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
         while (1) {
            switch (_context2.prev = _context2.next) {
               case 0:
                  logger.debug('startSupervisor');
                  supervisorMeta = getSupervisorMeta();

                  logger.debug('supervisor.spec', supervisorMeta.spec);
                  logger.debug('supervisor config', JSON.stringify(supervisorMeta.config, null, 3));
                  _context2.next = 6;
                  return createSupervisor(supervisorMeta);

               case 6:
                  supervisor = _context2.sent;

                  assert(lodash.isFunction(supervisor.init), 'supervisor.init');
                  Object.assign(supervisor, Object.assign({ logger: logger, config: supervisorMeta.config }, supervisorMeta.state));
                  _context2.prev = 9;
                  _context2.next = 12;
                  return supervisor.init();

               case 12:
                  logger.info('started pid', process.pid);
                  process.on('SIGTERM', function () {
                     logger.info('SIGTERM');
                     supervisor.end();
                  });
                  _context2.next = 20;
                  break;

               case 16:
                  _context2.prev = 16;
                  _context2.t0 = _context2['catch'](9);

                  if (_context2.t0.errno) {
                     logger.error({ err: _context2.t0.message, errno: _context2.t0.errno });
                  } else if (_context2.t0.code) {
                     logger.error({ err: _context2.t0.message, code: _context2.t0.code });
                  } else if (!_context2.t0.name) {
                     logger.error(_context2.t0);
                  } else if (lodash.includes(['TypeError'], _context2.t0.name)) {
                     logger.error(_context2.t0);
                  } else if (lodash.includes(['ValidationError', 'ApplicationError', 'AssertionError'], _context2.t0.name)) {
                     logger.error(_context2.t0.message);
                  } else {
                     logger.error(_context2.t0);
                  }
                  supervisor.end();

               case 20:
               case 'end':
                  return _context2.stop();
            }
         }
      }, _callee2, this, [[9, 16]]);
   }));
   return function startSupervisor() {
      return ref.apply(this, arguments);
   };
}();

// messages

var Messages = require('./SupervisorStarter.messages.js');

// create context for Supervisor and components

// globals

function assignLibs(g) {
   g.assert = require('assert');
   g.bluebird = require('bluebird');
   g.bunyan = require('bunyan');
   g.crypto = require('crypto');
   g.fs = require('fs');
   g.http = require('http');
   g.lodash = require('lodash');
   g.os = require('os');
   g.redisLib = require('redis');
}

function assignErrors(g) {
   g.ApplicationError = function () {
      this.constructor.prototype.__proto__ = Error.prototype;
      Error.captureStackTrace(this, this.constructor);
      this.name = 'ApplicationError';
      var args = [].slice.call(arguments);
      if (args.length === 1) {
         this.message = args[0].toString();
      } else {
         this.message = args.toString();
      }
   };
   g.ValidationError = function () {
      this.constructor.prototype.__proto__ = Error.prototype;
      Error.captureStackTrace(this, this.constructor);
      this.name = 'ValidationError';
      var args = [].slice.call(arguments);
      if (args.length === 1) {
         this.message = args[0].toString();
      } else {
         this.message = args.toString();
      }
   };
}

assignLibs(global);
assignErrors(global);

// logging

var config = {
   loggerName: 'supervisor',
   loggerLevel: 'info'
};
if (process.env.loggerLevel) {
   config.loggerLevel = process.env.loggerLevel;
} else if (process.env.NODE_ENV === 'development') {
   config.loggerLevel = 'debug';
}

global.loggerLevel = config.loggerLevel;
if (process.env.loggerUrl) {
   global.loggerUrl = process.env.loggerUrl;
}

var logger = global.bunyan.createLogger({ name: config.loggerName, level: config.loggerLevel });

// redis

bluebird.promisifyAll(redisLib.RedisClient.prototype);
bluebird.promisifyAll(redisLib.Multi.prototype);
redisLib.RedisClient.prototype.multiExecAsync = function (fn) {
   var multi = this.multi();
   fn(multi);
   return multi.execAsync();
};

// dependencies

function assignDeps(g) {
   g.Loggers = require('./Loggers');
   g.Asserts = require('./Asserts');
   g.ClassPreprocessor = require('./ClassPreprocessor');
   g.CsonFiles = require('./CsonFiles');
   g.Files = require('./Files');
   g.Metas = require('./Metas');
   g.Millis = require('./Millis');
   g.Promises = require('./Promises');
   g.Requests = require('./Requests');
   g.Strings = require('./Strings');
   g.Values = require('./Values');
}

assignDeps(global);

// supervisor configuration

function getSupervisorMeta() {
   logger.debug('getSupervisorMeta');
   var componentsConfig = getComponentsConfig();
   logger.debug('config.spec', componentsConfig.spec);
   var componentsMeta = CsonFiles.readFileSync('./components.cson');
   logger.debug('components.spec', componentsMeta.spec);
   if (!Metas.isSpecType(componentsMeta, 'components')) {
      throw { message: 'components.cson spec: ' + componentsMeta.spec };
   }
   Object.assign(config, {
      availableComponents: componentsMeta.components,
      components: componentsConfig.components
   });
   return Object.assign(CsonFiles.readFileSync('./lib/Supervisor.cson'), { config: config });
}

function getComponentsConfig() {
   if (!process.env.configModule) {
      throw Messages.missingConfigModule();
   }
   logger.info('env.configModule', process.env.configModule);
   var config = require('.' + process.env.configModule);
   Object.keys(config).forEach(function (name) {
      var componentConfig = config[name];
      Object.keys(componentConfig).forEach(function (key) {
         var envKey = name + '_' + key;
         if (process.env[envKey]) {
            componentConfig[key] = process.env[envKey];
         }
      });
   });
   return config;
}
//# sourceMappingURL=SupervisorStarter.js.map