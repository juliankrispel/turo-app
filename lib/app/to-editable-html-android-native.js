"use strict";
var _ = require("underscore"),
    turo = require("turo"),
    toSource = turo.toSource,
    toHtml = require("./to-html");

var display = _.defaults({

  number: function (token, string, context, offset) {
    return string;
  },

  powerStart: function (token, string, context, offset) {
    return string;
  },

  errorStart: function (node, string, context, offset) {
    var color = '#802020';
    return '<font color="' + color + '">';
  },

  errorEnd: function (node, tokens, context, offset) {
    return '</font>';
  },

}, toHtml.display);

module.exports = {
  toString: toSource.createToString(display),

  insertCursorIntoString: function (text, pos, txt) {
    return text;
  },

  display: display,
  displayImpliedParentheses: function (bool) {
    display.alwaysDisplayParens = !!bool;
  },
};
