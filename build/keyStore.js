'use strict';

var bunyan = require('bunyan');

var logger = bunyan.createLogger({ name: "cryptoserver.keyStore" });

var keyItems = {};

function createInstance() {
   var that = {
      put: function put(user, keyName, key) {
         logger.info('put', keyName);
         keyItems[keyName] = {
            timestamp: new Date().getTime(),
            keyName: keyName,
            key: key
         };
      },
      get: function get(user, keyName) {
         return keyItems[keyName];
      },
      clear: function clear(user, keyName) {
         if (keyItems.hasOwnProperty(keyName)) {
            keyItems[keyName] = undefined;
         }
      }
   };
   return that;
}

module.exports = createInstance();
//# sourceMappingURL=keyStore.js.map