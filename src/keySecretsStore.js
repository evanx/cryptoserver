

const bunyan = require('bunyan');

const logger = bunyan.createLogger({name: "cryptoserver.keySecretsStore"});

const keySecrets = {};

function createInstance() {
   const that = {
      monitor: function () {
         logger.debug('monitor', that.options.secretTimeoutSeconds);
         if (that.options.secretTimeoutSeconds) {
            Object.keys(keySecrets).forEach(function (keyName) {
               const item = keySecrets[keyName];
               if (item) {
                  const duration = new Date().getTime() - item.timestamp;
                  logger.debug('monitor duration', keySecrets.keyName, duration, item.timestamp);
                  if (duration > that.options.secretTimeoutSeconds * 1000) {
                     logger.info('monitor expire', keySecrets.keyName, duration);
                     keySecrets[keyName] = undefined;
                  }
               }
            });
         }
      },
      init: function (options) {
         that.options = options;
      },
      put: function (user, keyName, command, custodianCount) {
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
      setSecret: function (user, keyName, secret) {
         logger.info('setSecret', user, keyName);
         const item = keySecrets[keyName];
         if (item) {
            item.secrets[user] = secret;
         }
         return item;
      },
      get: function (user, keyName) {
         logger.info('get', user, keyName);
         return keySecrets[keyName];
      },
      clear: function (user, keyName) {
         logger.info('clear', user, keyName);
         if (keySecrets.hasOwnProperty(keyName)) {
            keySecrets[keyName] = undefined;
         }
      }
   };
   return that;
}

module.exports = createInstance();
