'use strict';

var bunyan = require('bunyan');

var logger = bunyan.createLogger({ name: "cryptoserver.keySecretsStore" });

var keySecrets = {};

function createInstance() {
   var that = {
      monitor: function monitor() {
         logger.debug('monitor', that.options.secretTimeoutSeconds);
         if (that.options.secretTimeoutSeconds) {
            Object.keys(keySecrets).forEach(function (keyName) {
               var item = keySecrets[keyName];
               if (item) {
                  var duration = new Date().getTime() - item.timestamp;
                  logger.debug('monitor duration', keySecrets.keyName, duration, item.timestamp);
                  if (duration > that.options.secretTimeoutSeconds * 1000) {
                     logger.info('monitor expire', keySecrets.keyName, duration);
                     keySecrets[keyName] = undefined;
                  }
               }
            });
         }
      },
      init: function init(options) {
         that.options = options;
      },
      put: function put(user, keyName, command, custodianCount) {
         logger.info('put', user, keyName, command, custodianCount);
         keySecrets[keyName] = {
            timestamp: new Date().getTime(),
            user: user,
            keyName: keyName,
            command: command,
            custodianCount: custodianCount,
            secrets: {}
         };
      },
      setSecret: function setSecret(user, keyName, secret) {
         logger.info('setSecret', user, keyName);
         var item = keySecrets[keyName];
         if (item) {
            item.secrets[user] = secret;
         }
         return item;
      },
      get: function get(user, keyName) {
         logger.info('get', user, keyName);
         return keySecrets[keyName];
      },
      clear: function clear(user, keyName) {
         logger.info('clear', user, keyName);
         if (keySecrets.hasOwnProperty(keyName)) {
            keySecrets[keyName] = undefined;
         }
      }
   };
   return that;
}

module.exports = createInstance();
//# sourceMappingURL=keySecretsStore.js.map