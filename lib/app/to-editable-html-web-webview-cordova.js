"use strict";
var _ = require("underscore"),
    turo = require("turo"),
    toSource = turo.toSource,
    toHtml = require("./to-html");

var cursorHtml = '<x-turo-cursor></x-turo-cursor>';

function tokenElementString (node, type, value, offset, classList) {
  if (offset === undefined) {
    offset = node.offsetFirst;
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

var pc = function (node, type, value, offset, context) {
  if (offset === undefined) {
    offset = node.offsetFirst;
  }
  offset += context.offsetCorrection;
  var string = tokenElementString(node, type, value, offset);
  return checkCursor(offset, context) + string + checkCursor(offset + value.length, context);
};

var display = _.defaults({

  number: function (node, string, context) {
    var self = this, 
        numbers = string.split(''),
        tokens = [];

    var offset = node._offsetLiteralFirst;
    _(numbers).forEach(function(number){
      tokens.push(pc(node, 'number', number, offset++, context));

    });
    return tokens.join("");
  },

  identifier: function (node, string, isConstant, context) {
    if (node.variableIsHidden) {
      // that is, the result of an expression that hasn't been named yet.
      // TODO set variableIsHidden, or make this test work.
      // TODO I have no idea what node.getValue() does, but I want it.
      return pc(node, 'number', node.getValue(), undefined, context);
    } else {
      return pc(node, 'identifier', string, undefined, context);
    }
  },

  operator: function (node, string, context) {
    string = this._literal(string, context);
    var classString;
    if (string[0] === ' ') {
      classString = 'padded';
    }
    return checkCursor(node._offsetLiteralFirst, context) + 
            tokenElementString(node, 'operator', string, node._offsetLiteralFirst + context.offsetCorrection, classString) + 
            checkCursor(node._offsetLiteralLast, context);
  },

  bracketStart: function (node, tokens, context) {
    if (node.inBrackets || this.alwaysDisplayParens) {
      this.pushTokens(tokens, '(', pc(node, 'bracket', '(', node.offsetFirst, context), context);
    }
  },

  bracketEnd: function (node, tokens, context) {
    // TODO check if this close token didn't really exist.
    if (node.inBrackets || this.alwaysDisplayParens) {
      tokens.push(pc(node, 'bracket', ')', node.offsetLast, context));
    }
  },

  unitLiteral: function (node, string, context) {
    return pc(node, 'unit', string, undefined, context);
  },

  powerStart: function (node, tokens, context) {
    tokens.push(pc(node, 'operator', this._literal("^", context), node._offsetLiteralFirst, context));
  },

  powerEnd: function (node, tokens, context) {
  },

  preRender: function (node, tokens, context) {
    var cursor = checkCursor(0, context);
    if (cursor) {
      display.pushTokens(tokens, '', cursor, context);
    }

  },

  postRender: function (node, tokens, context) {
    // NOP
    var cursor = checkCursor(node.offsetLast + 1, context);
    if (cursor) {
      display.pushTokens(tokens, '', cursor, context);
    }    
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
