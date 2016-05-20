"use strict";

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.pick = pick;
function pick(env, keys) {
   var result = {};
   keys.filter(function (key) {
      return env.hasOwnProperty(key);
   }).forEach(function (key) {
      return result[key] = env[key];
   });
   return result;
}
//# sourceMappingURL=Environment.js.map