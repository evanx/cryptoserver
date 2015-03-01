

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver.keySecretsStore"});

var keySecrets = {};

function createInstance() {
   var that = {
      monitor: function () {
         log.info('monitor', that.options.secretTimeoutSeconds);
         if (that.options.secretTimeoutSeconds) {
            Object.keys(keySecrets).forEach(function (keyName) {
               var keySecretsItem = keySecrets[keyName];
               var duration = new Date().getTime() - keySecretsItem.timestamp;
               if (duration > that.options.secretTimeoutSeconds*1000) {
                  log.info('monitor expire', keySecrets.keyName, duration);
                  keySecrets[keyName] = undefined;
               }
            });
         }
      },
      init: function (options) {
         that.options = options;
         that.monitor();
      },
      create: function (keyName, command, custodianCount) {
         keySecrets[keyName] = {
            timestamp: new Date(),
            keyName: keyName,
            command: command,
            custodianCount: custodianCount,
            secrets: {}
         };
      },
      get: function (keyName) {
         return keySecrets[keyName];
      },
      clear: function (keyName) {
         keySecrets[keyName] = undefined;
      }
   };
   return that;
}

module.exports = createInstance();