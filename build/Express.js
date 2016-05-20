"use strict";

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.getRoutes = getRoutes;
exports.listen = listen;
function getRoutes(expressApp) {
   return expressApp._router.stack.filter(function (middleware) {
      return middleware.route;
   }).map(function (middleware) {
      return middleware.route.path;
   });
}

function listen(expressApp, port) {
   return Promises.promisify(function (callback) {
      return expressApp.listen(port, callback);
   });
}
//# sourceMappingURL=Express.js.map