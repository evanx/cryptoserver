
var keySecrets = {};

module.exports = {
   create: function (keyName, command, custodianCount) {
      keySecrets[keyName] = {
         keyName: keyName,
         command: command,
         custodianCount: custodianCount,
         secrets: {}
      };
   },
   get: function (keyName) {
      return keySecrets[keyName];
   },
   clear: function(keyName) {
      keySecrets[keyName] = undefined;
   }
};

