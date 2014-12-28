"use strict";
var _ = require("underscore"),
    turo = require("turo"),
    toSource = turo.toSource,
    toHtml = require("./to-html");

var cursorHtml = '<x-turo-cursor></x-turo-cursor>';

function tokenElementString (token, type, value, offset, classList) {
  if (offset === undefined) {
    offset = token.offset;
  }
  var string = 
      '<x-turo-token type="' + type + '" ' + ' offset="' + offset + '"';

  if (classList) {
    string += ' class="' + classList + '"';
  }

  string += '>';
  if (value !== undefined) {
    string += value;
  }
  return string + '</x-turo-token>';
}

var checkCursor = function (offset, context) {
  if (context.cursorRendered) {
    return '';
  }
  var cursorPosition = context.prefs.cursorPosition;
  if (typeof cursorPosition !== 'number') {
    return '';
  }
  if (cursorPosition <= (offset + context.offsetCorrection)) {
    context.cursorRendered = true;
    return '<x-turo-cursor></x-turo-cursor>';
  }
  return '';
};

var pc = function (token, type, literal, offset, context) {
  var string = tokenElementString(token, type, literal, offset);
  return checkCursor(offset, context) + string + checkCursor(offset + literal.length, context);
};

var display = _.defaults({

  cursor: function (token, string, context, offset) {
    return cursorHtml;
  },

  number: function (token, string, context, offset) {
    var self = this, 
        numbers = string.split(''),
        tokens = [];

    _(numbers).forEach(function(number){
      tokens.push(pc(token, 'number', number, offset++, context));
    });
    return tokens.join("");
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
    txt = txt || cursorHtml;
    return text.substring(0, pos) + txt + text.substring(pos);
  },

  display: display,
  displayImpliedParentheses: function (bool) {
    display.alwaysDisplayParens = !!bool;
  },
};
