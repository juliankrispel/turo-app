"use strict";
var _ = require("underscore"),
    turo = require("turo"),
    toSource = turo.toSource,
    toHtml = require("./to-html");

function tokenElementString (token, type, value, offset, classList) {
  if (offset === undefined) {
    offset = token.offset;
  }
  var string = 
      '<x-turo-token type="' + type + '" offset="' + offset + '"';

  if (classList && _.isString(classList)) {
    string += ' class="' + classList + '"';
  }

  if (value !== undefined) {
    string += '>' + value + '</x-turo-token>';
  } else {
    string += '/>';
  }
  return string;
}

var pc = tokenElementString;

var display = _.defaults({

  cursorString: '<x-turo-cursor></x-turo-cursor>',

  number: function (token, string, context, offset) {
    return pc(token, 'number', string, offset, context);
  },

  identifier: function (token, string, context, offset) {
    if (token.variableIsHidden) {
      // that is, the result of an expression that hasn't been named yet.
      // TODO set variableIsHidden, or make this test work.
      // TODO I have no idea what token.getValue() does, but I want it.
      return pc(token, 'number', token.getValue(), offset, context);
    } else {
      return pc(token, 'identifier', string, offset, context);
    }
  },

  operator: function (token, string, context, offset) {
    return pc(token, 'operator', string, offset, context);
  },

  bracketStart: function (token, string, context, offset) {
    return pc(token, 'bracket', '(', offset, context);
  },

  bracketEnd: function (token, tokens, context, offset) {
    return pc(token, 'bracket', ')', offset, context);
  },

  unitLiteral: function (token, string, context, offset) {
    return pc(token, 'unit', string, offset, context);
  },

  powerStart: function (token, string, context, offset) {
    return pc(token, 'operator', string, offset, context);
  },

  powerEnd: function (token, string, context, offset) {
  },

  errorStart: function (node, string, context, offset) {
    var color = '#cf6a6a';
    return '<font color="' + color + '">';
  },

  errorEnd: function (node, tokens, context, offset) {
    return '</font>';
  },
}, toHtml.display);

module.exports = {
  toString: toSource.createToString(display),

  insertCursorIntoString: function (text, pos, txt) {
    // Deprecated
  },

  display: display,
  displayImpliedParentheses: function (bool) {
    display.alwaysDisplayParens = !!bool;
  },
};
