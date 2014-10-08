var _ = require('underscore');

/************************************************************
  Private utility functions.
/************************************************************/
function _addToPath (node, ctx) {
  // if (node.inBrackets) {
  //   ctx.path.push(node);
  // }
}

function clone (src) {
  return src.clone();
}

function _considerParens(expressionString, cursorPosition) {
  return expressionString[cursorPosition] === ')' || 
         false; // expressionString[cursorPosition] === '(';
}

function chip(string, cursorPosition) {
  return string.substring(0, cursorPosition) + '|' + string.substring(cursorPosition);
}

function debug(string, cursorPosition, msg, nodeType, node) {
  if (string) {
    console.log(chip(string, cursorPosition ) + ' ' + nodeType + ": " + msg);
  } else {
    console.log(cursorPosition + ' ' + nodeType + ': ' + msg);
  }
}


/************************************************************
  Token finder by cursor.
/************************************************************/

function CursorPositionTokenFinder() {
  // ctor
}

// Methods
_.extend(CursorPositionTokenFinder.prototype, {

  _visitCloneChild: function (node, property, position, ctx) {
    node = clone(node);
    ctx.parentNode = node;
    node[property] = node[property].accept(this, position, ctx);
    return node;
  },

  _drillDownUnits: function (node, position, ctx) {
    ctx.valueNode = node;
    return this._drillDown(node, 'unitNode', position, ctx);
  },

  _drillDown: function (node, property, position, ctx) {
    var child = node[property];
    if (child && position >= child.offsetFirst && 
        position <= child.offsetLast) {
      return this._visitCloneChild(node, property, position, ctx);
    }
  },

  _drillDownLeft: function (node, property, position, ctx) {
    return this._drillDown(node, property, position, ctx);
  },

  _drillDownRight: function (node, property, position, ctx) {
    return this._drillDown(node, property, position, ctx);
  },

  _matchFound: function (node, cursorPosition, ctx) {
    var child;
    if (ctx.editor) {
      node = clone(node);
      child = node.accept(ctx.editor, cursorPosition, ctx) || node;
    } else {
      child = node;
    }
    return child;
  },

  _nonTerminal: function (node, position, ctx) {
    return this._matchFound(node, position, ctx);
  },

  visitUnaryOperation: function(node, position, ctx) {
    return this._drillDown(node, 'value', position, ctx) || 
           this._nonTerminal(node, position, ctx);
  },

  visitBinaryOperator: function(node, position, ctx) {
    debug(ctx.string, position, 'Finding', 'BinaryOperator', node);
    return this._drillDownLeft(node, 'left', position, ctx) || 
           this._drillDownRight(node, 'right', position, ctx) || 
           this._nonTerminal(node, position, ctx);
  },

  visitUnitPower: function (node, position, ctx) {
    return this._drillDownLeft(node, 'unitNode', position, ctx) || 
           this._drillDownRight(node, 'exponent', position, ctx) || 
           this._nonTerminal(node, position, ctx);
  },

  visitUnitMultOp: function (node, position, ctx) {
    return this._drillDownLeft(node, 'left', position, ctx) || 
           this._drillDownRight(node, 'right', position, ctx) || 
           this._nonTerminal(node, position, ctx);
  },

  visitInteger: function(node, position, ctx) {
    return this._drillDownUnits(node, position, ctx) ||
           this._matchFound(node, position, ctx);
  },

  visitIdentifier: function(node, position, ctx) {
    return this._matchFound(node, position, ctx);
  },

  visitUnitLiteral: function (node, position, ctx) {
    return node;
  },
});


/************************************************************
  TokenDeleter
/************************************************************/

function TokenDeleter () {
  // ctor
}

// Methods
_.extend(TokenDeleter.prototype, {

  _isPositionParens: function (node, position, ctx) {
    return node.inBrackets && (node.offsetFirst === position || node.offsetLast === position);
  },

  // deals with the very specific case of: (|1.2) -> 1.2 and (1.2)| -> 1.2
  _deleteMatchingParens: function (node, position, ctx) {
    if (this._isPositionParens(node, position, ctx)) {
      node.inBrackets = false;
      return node;
    }
  },

  visitUnaryOperation: function(node, position, ctx) {
    return node.value;
  },

  visitBinaryOperator: function(node, position, ctx) {
    debug(ctx.string, position, 'Deleting', 'BinaryOperator', node);
    if (this._isPositionParens(node, position, ctx)) {
      if (position === node.offsetFirst) {
      } else {
        node.isMissingCloseParens = true;
      }
      return node;
    }
    node.literal = '';
    return node;
  },

//(ctx.editor, cursorPosition, ctx)
  visitInteger: function(node, position, ctx) {
    var string = node.literal;
    if (this._deleteMatchingParens(node, position)) {
      return node;
    }
    position -= node._og_offsetFirst || node.offsetFirst || 0;
    node.literal = string.substring(0, position) + string.substring(position + 1);
    return node;
  },

  visitIdentifier: function(node, position, string) {
    if (this._deleteMatchingParens(node, position)) {
      return node;
    }
    position -= node._og_offsetFirst || node.offsetFirst || 0;
    node.name = '';
    return node;
  },

  visitUnitLiteral: function (node, position, string) {
    debug(string, position, 'Deleting', 'UnitLiteral', node);
    var start = node.offsetFirst;
    var end = node.offsetLast;
    while (string[start - 1] === ' ') {
      start --;
    }
    return  string.substring(0, start) + string.substring(end);
  },

  visitUnitPower: function(node, position, string) {
    debug(string, position, 'Deleting', 'UnitPower', node);
    return string.substring(0, node.unitNode.offsetLast) + string.substring(node.exponent.offsetLast);
  },

  visitUnitMultOp: function(node, position, string) {
    debug(string, position, 'Deleting', 'UnitMultOp: ' + node.literal + '.', node);
    if (node.literal === '/') {
      return string.substring(0, node.left.offsetLast) + ' ' + string.substring(node.right.offsetFirst);
    }
    return string.substring(0, node.left.offsetFirst) + string.substring(node.right.offsetFirst);
  },

});

/************************************************************
  Token Inserter
  Currently deliberately a very small subset of circumstances.
/************************************************************/

function TokenInserter () {
  // ctor
}

// Methods
_.extend(TokenInserter.prototype, {
  visitUnaryOperation: function (node, string, token, cursorPosition) {
    var insertionPoint = node.value.offsetFirst;
    return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
  },

  visitBinaryOperator: function (node, string, token, cursorPosition) {
    // here: we only care about things after the end of the operator token. 
    // TODO FIX so we can have multiple character operators, and still not care about cursor positions.
    if (cursorPosition === node.right.offsetFirst) {
      var insertionPoint = node.right.offsetFirst;
      return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
    }
    return "BINARY_OP_BAD";
  },

  visitInteger: function (node, string, token, cursorPosition) {

    if (node._valueNode) {
      return node._valueNode.accept(this, string, token, cursorPosition);
    }

    var insertionPoint;

    if (cursorPosition <= node.offsetFirst) {
      insertionPoint = cursorPosition;
    } else if (cursorPosition <= node.offsetLast) {
      insertionPoint = node.offsetFirst;
    } else {
      insertionPoint = node.offsetFirst; // we be at the end of the input.
    }

    if (token.type === 'exponent' || token.type === 'dot') {
      // TODO implement checking if there exists 
      // '.' or 'e', and move it to here if it can.
    }

    // TODO is the integer node in brackets?

    return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
  },

  visitIdentifier: function(node, string, token, cursorPosition) {
    var insertionPoint;

    if (cursorPosition <= node.offsetFirst) {
      insertionPoint = cursorPosition;
    } else if (cursorPosition <= node.offsetLast) {
      insertionPoint = node.offsetFirst;
    } else {
      return "BAD_IDENTIIER: " + chip(string, cursorPosition);
    }

    // TODO is the integer node in brackets?

    return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
  },

  visitUnitLiteral: function (node, position, string) {
    return node._valueNode.accept(this, position, string);
  },

  visitUnitPower: function(node, position, string) {
    return node._valueNode.accept(this, position, string);
  },

  visitUnitMultOp: function(node, position, string) {
    return node._valueNode.accept(this, position, string);
  },

});


/************************************************************
  ExpressionEditor
/************************************************************/

function ExpressionEditor() {
}

var _prototype = ExpressionEditor.prototype;

// stateless
var tokenFinder = new CursorPositionTokenFinder(),
    tokenDeleter = new TokenDeleter(),
    tokenInserter = new TokenInserter();

// Properties
Object.defineProperties(_prototype, {

});


// Methods
_.extend(_prototype, {
  append: function (expressionString, node, token) {
    return this.insert(expressionString, expressionString.length, node, token);
  },

  insert: function (expressionString, cursorPosition, node, token) {
    // input assumptions: 
    // - expressionToString is the current expression.
    // - node is the ast node of the current complete expression. If absent, the expressionString is not parseable.
    // - token in a struct which should be the same as passed from editor-controller.

    // output assumptions: 
    // - return should be a string.
    // - it does not have to be completely parsable (e.g. '1+').
    var beginString = expressionString.substring(0, cursorPosition),
        endString = expressionString.substring(cursorPosition);

    if (!node || !expressionString) { // expressionString === ''
      return beginString + token.key + endString;
    }
    switch (token.type) {
      case 'unit':
        if (expressionString[cursorPosition - 1] !== '/') {
          beginString += ' ';
        }
        break;
      case 'prefixOp':
      case 'parensOpen':
        return this._insert(expressionString, node, token, cursorPosition);
      default:
        
    }
    return this._insert(expressionString, node, token, cursorPosition);
  },

  _insert: function (expressionString, node, token, ogCursorPosition) {
    var cursorPosition = ogCursorPosition, 
      ast = node.expression();

    while (cursorPosition === ' ') {
      cursorPosition --;
    }
    // explicitly consider character before and at the cursor position.
    // _considerParens should be used at insert point to detect '(' as last typed and if prefixOp or openParens

    // insert in binary node should explicitly deal with left, right, in between, and in brackets

    var ctx = {
      path: [],
      string: expressionString, // only for DEBUG
      considerBrackets: _considerParens(expressionString, cursorPosition - 1),
      editor: tokenInserter
    };

    if (cursorPosition >= expressionString.length) {
      cursorPosition = expressionString.length;
    }

    var astNode, insertPoint, excisionPoint;
    return ast.accept(tokenFinder, cursorPosition - 1, ctx);
  },

  _delete: function (expressionString, node, cursorPosition) {
    // expressionString: manadatory.
    // node - the result of evaluating expressionString. At this point, it is known that expressionString is parsable.
    // cursorPosition is the last known position of the cursor
    var ast = node.expression();

    var ctx = {
      path: [],
      string: expressionString, // only for DEBUG
      considerBrackets: _considerParens(expressionString, cursorPosition - 1),
      editor: tokenDeleter,
    };

    if (cursorPosition >= expressionString.length) {
      cursorPosition = expressionString.length;
    }
    if (cursorPosition > 0) {
      return ast.accept(tokenFinder, cursorPosition - 1, ctx);
    } else {
      return ast;
    }
  },

});

module.exports = {
  ExpressionEditor: ExpressionEditor
};