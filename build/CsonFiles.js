'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.readFileSync = readFileSync;

var CSON = require('season');

function readFileSync(file) {
   return CSON.readFileSync(file);
}
//# sourceMappingURL=CsonFiles.js.map