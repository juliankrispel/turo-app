"use strict";
// TO-HTML-ANDROID!

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
    return string;
  },

  bracketEnd: function (token, string, context, offset) {
    return string;
  },

  /********
   * Colors and styles.
   */

  identifier: function (token, string, context, offset) {
    return string;
  },

  operator: function (token, string, context, offset) {
    return string;
  },

  number: function (token, string, context, offset) {
    var prefs = context.prefs;
    if (prefs.formatComma) {
      string = _formatNumber(string, prefs.formatComma, prefs.formatDot || ".");
    }
    return string;
  },

  powerStart: function (token, string, context, offset) {
    return '<sup><small>';
  },

  powerEnd: function (token, string, context, offset) {
    return '</small></sup>';
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
