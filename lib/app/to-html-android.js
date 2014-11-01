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
  bracketStart: function (node, tokens, context) {
    if (node.inBrackets || this.alwaysDisplayParens) {
      this.pushTokens(tokens, '(');
    }
  },

  bracketEnd: function (node, tokens, context) {
    // TODO check if this close token didn't really exist.
    if (node.inBrackets || this.alwaysDisplayParens) {
      tokens.push(')');
    }
  },

  /********
   * Colors and styles.
   */

  identifier: function (node, string, isConstant) {
    return 'string';
  },

  operator: function (node, string, context) {
    string = this._literal(string, context);
    return string;
  },

  number: function (node, string, context) {
    var prefs = context.prefs;
    if (prefs.formatComma) {
      string = _formatNumber(string, prefs.formatComma, prefs.formatDot || ".");
    }
    return string;
  },

  powerStart: function (node, tokens, context) {
    // cursor should be able to navigate layout spans.
    tokens.push('<span class="superscript">');
  },

  powerEnd: function (node, tokens, context) {
    tokens.push('</span>');
  },

  unitStart: function (node, unit, tokens, context) {
    tokens.push(" ");
  },

  unitEnd: function (node, unit, tokens, context) {},

}, toSource.stringDisplay);

module.exports = {
  toString: toSource.createToString(display),
  display: display,
  displayImpliedParentheses: function (bool) {
    display.alwaysDisplayParens = !!bool;
  },
  
};
