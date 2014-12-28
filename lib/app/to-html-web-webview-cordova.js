"use strict";
var _ = require("underscore"),
    turo = require("turo"),
    toSource = turo.toSource;

function _formatNumber (string, comma, point) {
  var parts = string.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, comma);
  return parts.join(point);
}

var display = _.defaults({
  bracketStart: function (token, string, context, offset) {
    return '<span class="bracket">(</span>';
  },

  bracketEnd: function (token, string, context, offset) {
    return '<span class="bracket">)</span>';
  },

  /********
   * Colors and styles.
   */

  identifier: function (token, string, context, offset) {
    return '<span class="identifier">' + string + '</span>';
  },

  operator: function (token, string, context, offset) {
    return '<span class="operator">' + string + '</span>';
  },

  number: function (token, string, context, offset) {
    var prefs = context.prefs;
    if (prefs.formatComma) {
      string = _formatNumber(string, prefs.formatComma, prefs.formatDot || ".");
    }
    return '<span class="number">' + string + '</span>';
  },

  powerStart: function (token, string, context, offset) {
    return '<span class="superscript">';
  },

  powerEnd: function (token, string, context, offset) {
    return '</span>';
  },

  unitStart: function (token, string, context, offset) {
  },

  unitEnd: function (token, string, context, offset) {},

}, toSource.stringDisplay);

module.exports = {
  toString: toSource.createToString(display),
  display: display,
  displayImpliedParentheses: function (bool) {
    display.alwaysDisplayParens = !!bool;
  },
  
};
