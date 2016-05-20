"use strict";

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.matches = matches;
function matches(string, regex) {
   var match = string.match(regex);
   if (!match) {
      return [];
   } else {
      return match.slice(1);
   }
}
//# sourceMappingURL=Strings.js.map