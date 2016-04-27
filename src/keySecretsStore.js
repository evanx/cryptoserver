

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver.keySecretsStore"});

var keySecrets = {};

function createInstance() {
   var that = {
      monitor: function () {
         log.debug('monitor', that.options.secretTimeoutSeconds);
         if (that.options.secretTimeoutSeconds) {
            Object.keys(keySecrets).forEach(function (keyName) {
               var item = keySecrets[keyName];
               if (item) {
                  var duration = new Date().getTime() - item.timestamp;
                  log.debug('monitor duration', keySecrets.keyName, duration, item.timestamp);
                  if (duration > that.options.secretTimeoutSeconds * 1000) {
                     log.info('monitor expire', keySecrets.keyName, duration);
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
         log.info('put', user, keyName, command, custodianCount);
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
         log.info('setSecret', user, keyName);
         var item = keySecrets[keyName];
         if (item) {            
            item.secrets[user] = secret;
         }
         return item;
      },
      get: function (user, keyName) {
         log.info('get', user, keyName);
         return keySecrets[keyName];
      },
      clear: function (user, keyName) {
         log.info('clear', user, keyName);
         if (keySecrets.hasOwnProperty(keyName)) {
            keySecrets[keyName] = undefined;
         }
      }
   };
   return that;
}

module.exports = createInstance();