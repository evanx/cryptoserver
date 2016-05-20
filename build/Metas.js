'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.isSpecType = isSpecType;
exports.pickEnv = pickEnv;
exports.getErrorKeys = getErrorKeys;
exports.getDefault = getDefault;
exports.getEnv = getEnv;

var logger = Loggers.create(__filename, 'info');

function isSpecType(meta, type) {
   logger.debug('isSpecType', meta.spec, type);
   return meta.spec.includes(type);
}

function pickEnv(meta, env) {
   var result = {};
   Object.keys(meta).filter(function (key) {
      return env.hasOwnProperty(key);
   }).forEach(function (key) {
      return result[key] = env[key];
   });
   return result;
}

function getErrorKeys(meta, props) {
   return Object.keys(meta).filter(function (key) {
      return !isValid(meta[key], key, props[key]);
   });
}

function isValid(meta, key, value) {
   logger.debug('isValid', key, value, meta);
   if (value === undefined) {
      return meta.optional;
   } else if (meta.type === 'url') {
      return typeof value === 'string' && value.match(/^http/);
   } else if (meta.type === 'file') {
      return typeof value === 'string' && Files.existsFile(value);
   } else if (meta.type === 'string') {
      return typeof value === 'string';
   } else if (meta.type === 'duration') {
      return parseInt(value) === value;
   } else if (meta.type === 'integer') {
      return parseInt(value) === value;
   } else if (meta.type === 'boolean' || lodash.isBoolean(meta.defaultValue)) {
      return lodash.isBoolean(value);
   } else if (meta.type === 'object') {
      return Object.keys(value).length;
   } else if (lodash.isString(meta.defaultValue) && lodash.isString(value)) {
      if (meta.regex) {
         logger.debug('isValid', meta, value);
         return new RegExp('^' + meta.regex + '$').test(value);
      } else {
         return true;
      }
   } else if (meta.defaultValue > 0 && value > 0) {
      if (meta.regex) {
         return new RegExp('^' + meta.regex + '$').test('' + value);
      } else {
         return true;
      }
      return true;
   } else if (lodash.isArray(meta.defaultValue) && lodash.isArray(value)) {
      return true;
   } else {
      return false;
   }
}

function getDefault(meta) {
   var result = {};
   Object.keys(meta).filter(function (key) {
      return meta[key].defaultValue !== undefined;
   }).forEach(function (key) {
      return result[key] = meta[key].defaultValue;
   });
   return result;
}

function getEnv(meta, componentName, env) {
   var result = {};
   Object.keys(meta).filter(function (key) {
      var envKey = [componentName, key].join('_');
      return env.hasOwnProperty(envKey);
   }).forEach(function (key) {
      var envKey = [componentName, key].join('_');
      result[key] = env[envKey];
   });
   logger.info('getEnv', componentName, Object.keys(result));
   return result;
}

// TODO integration the following

/*
var that = {
   minTimestamp: 1459109145,
   minInterval: 1,
   maxInterval: 3600,
   defaultProps: {},
   validateProps: function(p) {
      Asserts.assertIntegerMax(p.serviceRenew, 'serviceRenew', p.serviceExpire - 5);
   },
   start: function(props) {
      Object.keys(props).forEach(function(key) {
         props[key].key = key;
         var defaultValue = props[key].defaultValue;
         if (defaultValue) {
            that.defaultProps[key] = defaultValue;
         }
      });
      console.log('defaultProps', that.defaultProps);
      that.validateProps(that.defaultProps);
      that.props = props;
   },
   validate(value, name) {
      assert.equal(typeof name, 'string', 'name');
      var meta = that.props[name];
      if (meta) {
         that.validateMeta(meta, value, name);
      }
      return value;
   },
   validateMeta(meta, value, name) {
      if (value === undefined) {
         if (!meta.optional) {
            throw new Error(`missing ${name}`);
         }
      }
      if (meta.min) {
         if (value >= meta.min) {
         } else {
            throw new Error(`${name} (${value}) min ${meta.min}`);
         }
      }
      if (meta.max) {
         if (value > meta.max) {
            throw new Error(`${name} (${value}) max ${meta.max}`);
         }
      }
      return value;
   },
   addTimestampInterval(timestamp, interval, name) {
      if (!interval || interval < that.minInterval || interval > that.maxInterval) {
         throw new Error(`${name} (${interval}) interval`);
      }
      return that.parseTimestamp(timestamp, name) + that.parseInt(interval);
   },
   validateTimestamp(value, name) {
      var timestamp = that.parseTimestamp(value, name);
      if (!timestamp) {
         throw new Error(`${name} timestamp`);
      }
      return timestamp;
   },
   validateMinExclusive(value, min, name) {
      if (value > min) {
         return value;
      } else {
         throw new Error(`${name} (${value}) min ${min}`);
      }
   },
   validateRangeInclusive(value, range, name) {
      if (value >= range[0] && value <= range[1]) {
         return value;
      } else {
         throw new Error(`${name} (${value}) range ${range}`);
      }
   },
   parseTimestamp(value, name) {
      var timestamp = that.parseInt(value, name);
      if (timestamp > 0 && timestamp < that.minTimestamp) {
         throw new Error(`${name} (${value}) timestamp`);
      }
      return timestamp;
   },
   parseInt(value, name) {
      if (value === 0) {
         return 0;
      } else if (!value) {
         return undefined;
      }
      var integerValue = parseInt(value);
      if (typeof value === 'string') {
      } else if (value !== integerValue) {
         throw new Error(`${name} (${value}) parseInt type ${typeof value}`);
      }
      if (integerValue === NaN) {
         throw new Error(`${name} (${value}) parseInt NaN`);
      }
      return integerValue;
   },
   validateInteger(value, name) {
      return that.validate(value, name);
   },
   validateIntegerMin(value, min, name) {
      that.validate(value, name);
      if (value >= min) {
      } else {
         throw new Error(`${name} (${value}) min ${min}`);
      }
      return value;
   },
   validateIntegerMin(value, min, name) {
      that.validate(value, name);
      if (value >= min) {
      } else {
         throw new Error(`${name} (${value}) min ${min}`);
      }
      return value;
   }

};
*/
//# sourceMappingURL=Metas.js.map