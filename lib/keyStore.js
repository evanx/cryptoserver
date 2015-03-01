

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "cryptoserver.keySecretsStore"});

var keyObjects = {};

function createInstance() {
   var that = {
      put: function (keyName, key) {
         keyObjects[keyName] = {
            timestamp: new Date().getTime(),
            keyName: keyName,
            key: key
         };
      },
      get: function (keyName) {
         return keyObjects[keyName];
      },
      clear: function (keyName) {
         keyObjects[keyName] = undefined;
      }
   };
   return that;
}

module.exports = createInstance();
