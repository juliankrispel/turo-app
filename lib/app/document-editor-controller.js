'use strict';
var _ = require('underscore');

function Controller ($native) {
  if ($native) {
    this.onLoad($native);
    this.onResume();
  }
}

_.extend(Controller.prototype, {
  onLoad: function ($native) {
    this.$native = $native;
  },

  onResume: function () {

  },

  onDocumentChange: function (stringDoc, cursorPosition) {
    
  },

  onStatementChange: function (stringStatement, cursorPosition) {},

  onCursorLineChange: function (newLineNo, cursorPosition) {},

  requestAutoComplete: function (cursorPosition) {},
});

Object.defineProperties(Controller.prototype, {});

module.exports = Controller;