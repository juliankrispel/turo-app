var _ = require('underscore');

/************************************************************
  Private utility functions.
/************************************************************/
var _debug = false; // (chip(string, position + 1) === '(1+|2)');

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
  if (!_debug) {
    return;
  }
  if (string) {
    console.log('expression-src-editor.js: ' + chip(string, cursorPosition ) + ' ' + nodeType + ": " + msg);
  } else {
    console.log('expression-src-editor.js: ' + cursorPosition + ' ' + nodeType + ': ' + msg);
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
    return node[property].accept(this, position, ctx);
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

  _afterOperator: function (node, property, position, ctx) {
    if (node._offsetLiteralFirst <= position &&
        position < node[property].offsetFirst) {
      ctx._isAfterOperator = true;
      return this._nonTerminal(node, position, ctx);
    }
  },

  _terminalInBrackets: function (node, position, ctx) {
    if (node.inBrackets) {
      if (node.offsetFirst === position || 
          node.offsetLast === position) {
        ctx._onBrackets = true;
        return this._matchFound(node, position, ctx);
      }
    }
  },

  _nonTerminalInBrackets: function (node, position, ctx) {
    if (node.inBrackets) {
      if (node.offsetFirst === position || 
          node.offsetLast === position) {
        ctx._onBrackets = true;
        return this._matchFound(node, position, ctx);
      }
    }
  },  

  _drillDownLeft: function (node, property, position, ctx) {
    var child = node[property];
    if (!child) {
      return;
    }
    if (child.offsetFirst <= position && position < node._offsetLiteralFirst) {
      return this._visitCloneChild(node, property, position, ctx);
    }
    return this._drillDown(node, property, position, ctx);
  },

  _drillDownRight: function (node, property, position, ctx) {
    var child = node[property];
    if (!child) {
      return;
    }
    if (child.offsetFirst <= position && position < node.offsetLast) {
      return this._visitCloneChild(node, property, position, ctx);
    }
    return this._drillDown(node, property, position, ctx);
  },

  _matchFound: function (node, cursorPosition, ctx) {
    throw new Error('Unimplemented');
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
    return this._nonTerminalInBrackets(node, position, ctx) ||
           this._drillDownLeft(node, 'left', position, ctx) || 
           this._afterOperator(node, position, 'right', ctx) ||
           this._drillDownRight(node, 'right', position, ctx) || 
           this._nonTerminal(node, position, ctx);
  },

  visitUnitPower: function (node, position, ctx) {
    return this._nonTerminalInBrackets(node, position, ctx) ||
           this._drillDownLeft(node, 'unitNode', position, ctx) || 
           this._afterOperator(node, position, 'exponent', ctx) ||
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
    return this._matchFound(node, position, ctx);
  },
});

/************************************************************
  CondemnedTokenFinder
/************************************************************/

function CondemnedTokenFinder() {
  // ctor
}
CondemnedTokenFinder.prototype = new CursorPositionTokenFinder();

// Methods
_.extend(CondemnedTokenFinder.prototype, {
  _matchFound: function (node, cursorPosition, ctx) {
    var newString;
    if (ctx.editor) {
      newString = node.accept(ctx.editor, cursorPosition, ctx);
      if (newString === undefined) { 
        newString = ctx.string;
      }
    } else {
      newString = ctx.string;
    }
    return newString;
  }
});

/************************************************************
  InsertionTokenFinder
/************************************************************/

function InsertionTokenFinder() {
  // ctor
}
InsertionTokenFinder.prototype = new CursorPositionTokenFinder();

// Methods
_.extend(InsertionTokenFinder.prototype, {
  _matchFound: function (node, position, ctx) {
    var newString;
    if (ctx.editor) {
      newString = node.accept(ctx.editor, position, ctx) || ctx.string;
    } else {
      newString = ctx.string;
    }
    return newString;
  }
});


/************************************************************
  TokenDeleter
/************************************************************/

function TokenDeleter () {
  // ctor
}

var padding = function (string, pos) {
      // check we;re not removing a bracket from between two words
      if (pos > 0 && pos < string.length - 2) {
        return (/\w{2}/).exec(string[pos - 1] + string[pos + 1]) ? " " : "";
      }
      return "";
    };

// Methods
_.extend(TokenDeleter.prototype, {

  // deals with the very specific case of: (|1.2) -> 1.2 and (1.2)| -> 1.2
  _deleteMatchingParens: function (node, position, string) {
    
    var removeParens = function remove (open, close, isOpening) {
      string = string.substring(0, open) +  // up until the (
        // not the open parens
        padding(string, open) + 
        string.substring(open + 1, close) + // between the '(' and the ')'
        // not the close parens
        padding(string, close) +
        string.substring(close + 1);
      var cursorPosition = position;
      if (!isOpening) {
        cursorPosition --;
      }
      return {
        string: string,
        cursorPosition: cursorPosition
      };
    };
    
    if (node.inBrackets) {
      if (node.offsetFirst === position || node.offsetLast === position) {
        return removeParens(node.offsetFirst, node.offsetLast, position === node.offsetFirst);
      }
    }
  },

  _deleteNonMatchingParens: function (node, position, string) {
    if (node.inBrackets) {
      if (node.offsetFirst === position || node.offsetLast === position) {
        return string.substring(0, position) + padding(string, position) + string.substring(position + 1);
      }
    }
  },

  visitUnaryOperation: function(node, position, ctx) { 
    var string = ctx.string;
    var insertionPoint, excisionPoint;
    if (node.isPrefix) {
      insertionPoint = node.offsetFirst;
      excisionPoint = node.value.offsetFirst;
    } else {
      insertionPoint = node.value.offsetLast + 1;
      excisionPoint = node.offsetLast + 1;
    }
    return string.substring(0, insertionPoint) + string.substring(excisionPoint);
  },

  visitBinaryOperator: function(node, position, ctx) { 
    var string = ctx.string;

    var newString = this._deleteNonMatchingParens(node, position, string);
    if (!newString) {
      newString = string.substring(0, node._offsetLiteralFirst) + string.substring(node._offsetLiteralLast + 1);
    }

    return newString;
  },

  visitInteger: function(node, position, ctx) { 
    var string = ctx.string;
    if (node.valueNode) {
      return node.valueNode.accept(this, position, ctx);
    }
    debug(string, position, 'Deleting', 'Integer', node);
    var newString = this._deleteMatchingParens(node, position, string);
    if (!newString) {
      newString = string.substring(0, position) + string.substring(position + 1, string.length);
    }

    return newString;
  },

  visitIdentifier: function(node, position, ctx) { 
    var string = ctx.string;
    debug(string, position, 'Deleting', 'Identifier', node);
    var newString = this._deleteMatchingParens(node, position, string);
    if (!newString) {
      var start = node._offsetLiteralFirst;
      var end = node._offsetLiteralLast + 1;
      newString = string.substring(0, start) + string.substring(end, string.length);
    }
    return newString;
  },

  visitUnitLiteral: function (node, position, ctx) { 
    var string = ctx.string;
    debug(string, position, 'Deleting', 'UnitLiteral', node);
    var start = node.offsetFirst;
    var end = node.offsetLast + 1;
    while (string[start - 1] === ' ') {
      start --;
    }
    return  string.substring(0, start) + string.substring(end);
  },

  visitUnitPower: function(node, position, ctx) { 
    var string = ctx.string;
    debug(string, position, 'Deleting', 'UnitPower', node);
    return string.substring(0, node.unitNode.offsetLast + 1) + string.substring(node.exponent.offsetLast + 1);
  },

  visitUnitMultOp: function(node, position, ctx) { 
    var string = ctx.string;
    debug(string, position, 'Deleting', 'UnitMultOp: ' + node.literal + '.', node);
    if (node.literal === '/') {
      if (node.left) {
        return string.substring(0, node.left.offsetLast + 1) + ' ' + string.substring(node.right.offsetFirst);
      } else {
        return string.substring(0, node.offsetFirst) + ' ' + string.substring(node.right.offsetFirst);
      }
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

  

  visitUnaryOperation: function(node, position, ctx) {
    var token = ctx.token,
        string = ctx.string;
    var insertionPoint = node.value.offsetFirst;
    // TODO this needs some polish: '(2' + '1/x' should be sqrt(1/2
    // It's not clear if this is where the problem is.
    return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
  },


  _insertAtTerminalCloseParensMaybe: function (node, position, token, string) {
    var cut1, cut2;
    if (!node.inBrackets) {
      return;
    }

    // here: we only care about things after the end of the operator token. 
    if (position === node.offsetLast) {
      // (1+x)| + sin( -> sin(1+x)
      cut1 = node.offsetFirst;
      // we don't want bracket proliferation, so remove the existing one.
      var containsBrackets = (token.key.indexOf('(') >= 0);
      cut2 = containsBrackets ? cut1 + 1 : cut1;
      
    } else if (node.offsetFirst < position) { // in the brackets not on the brackets.
      cut1 = cut2 = node._offsetLiteralFirst;
    }


    if (cut1 !== undefined) {
      return string.substring(0, cut1) + token.key + string.substring(cut2);
    }
  },

  _insertAtCloseParensMaybe: function (node, position, token, string) {
    var cut1, cut2;

    // here: we only care about things after the end of the operator token. 
    if (node.inBrackets && position === node.offsetLast) {
      // (1+x)| + sin( -> sin(1+x)
      cut1 = node.offsetFirst;
      // we don't want bracket proliferation, so remove the existing one.
      var containsBrackets = (token.key.indexOf('(') >= 0);
      cut2 = containsBrackets ? cut1 + 1 : cut1;
      return string.substring(0, cut1) + token.key + string.substring(cut2);
    }
  },

  visitBinaryOperator: function(node, position, ctx) {
    var token = ctx.token,
        string = ctx.string,
        cut1, cut2;
    
    function d(string) {
      if (_debug) {
        console.log('not ok ' + string);
      }
    }

    // here: we only care about things after the end of the operator token. 
    var retValue = this._insertAtCloseParensMaybe(node, position, token, string);
    if (retValue) {
      d('_insertAtCloseParensMaybe');
      return retValue;
    } else if (node.inBrackets && position < node.offsetFirst) {
      // |(1+2) -> sin
      d('Before first bracket');
      cut1 = node.offsetFirst;
    } else if (node.left.offsetFirst <= position && position < node._offsetLiteralFirst) {
      d('The beginning of the left to just before the operator');
      // (|1+2) -> (sin(1+2)
      cut1 = node.left.offsetFirst;
    } else if (node._offsetLiteralFirst <= position) {
      d('After the beginning of the operator');
      cut1 = node.right.offsetFirst;
    } else if (position < node._offsetLiteralFirst) { // i.e. before the operator symbol literal.
      d('Before the operator?');
      cut1 = node.left.offsetFirst;
    } else {
      d('Default?');
      cut1 = node.offsetFirst;
    }

    if (cut2 === undefined) {
      cut2 = cut1;
    }

    return string.substring(0, cut1) + token.key + string.substring(cut2);
  },

  visitInteger: function(node, position, ctx) {
    var token = ctx.token,
        string = ctx.string;

    // This is just for unitPower calls. 2 m^3. If we are '2', valueNode is undefined, '3' points to '2'.
    if (node.valueNode) {
      return node.valueNode.accept(this, position, ctx);
    }

    function indexOfChar(string, character, min, max) {
      for (var i=min; i <= max; i++) {
        if (string[i] === character) {
          return i;
        }
      }
      return -1;
    }

    var pointIndex;
    var exponentIndex;
  
    var insertionPoint, newString, clipCursorToToken = true;

    if (token.type === 'prefixOp' || token.type === 'parensOpen') {
      var retValue = this._insertAtTerminalCloseParensMaybe(node, position, token, string);
      if (retValue) {
        return retValue;
      } else if (position < node.offsetFirst) {
        insertionPoint = position;
      } else if (position <= node.offsetLast) {
        insertionPoint = node.offsetFirst;
        clipCursorToToken = false;
      } else {
        insertionPoint = node.offsetFirst; // we be at the end of the input.
        clipCursorToToken = false;
      }
    } else if (token.type === 'exponent') {

      // scenarios: 
      /* 
        10.34| + e -> 10.34e|
        10.3|4 + e -> 103.4e-1|
      */
      clipCursorToToken = false;
      if (position === node.offsetLast) {
        insertionPoint = position + 1;        
      } else {
        pointIndex = indexOfChar(string, '.', node._offsetLiteralFirst, node._offsetLiteralLast);
        exponentIndex = indexOfChar(string, 'e', position + 1, node._offsetLiteralLast);

        var newExponent = +(node.exponent);

        var last = node._offsetLiteralLast;
        if (pointIndex < 0) {

          if ((position + 1) !== exponentIndex) {
            string = string.substring(0, position + 1) + '.' + string.substring(position + 1);
            last ++;
            if (exponentIndex >= 0) {
              pointIndex = exponentIndex - 1;
              exponentIndex++;
            }
          } else if (exponentIndex >= 0) {
            pointIndex = exponentIndex - 1; 
          }

          if (pointIndex < 0) {
            pointIndex = last - 1;
          }
          
        } else if (position > pointIndex) {
          string = string.substring(0, pointIndex) + string.substring(pointIndex + 1);
          if ((position + 1) !== exponentIndex) {
            string = string.substring(0, position) + '.' + string.substring(position);
          } else {
            exponentIndex --;
            last --;
          }
          if (!node.integerPart || node.integerPart === '0') {
            var partLength = (node.integerPart || '').length,
                startIndex = pointIndex - partLength;

            // this is beginning to feel reaaly brittle
            var dotOrNonZero = startIndex, character;
            while (dotOrNonZero < position) {
              character = string[dotOrNonZero];
              if (character !== '0' || character === '.') {
                break;
              }
              dotOrNonZero ++;
            }
            
            //
            var posChange, deltaE;
            if (dotOrNonZero === position) {
              // when dotOrNonZero === position
              string = string.substring(0, startIndex) + string.substring(dotOrNonZero - partLength);
              posChange = (dotOrNonZero - pointIndex);
              deltaE = -(dotOrNonZero - startIndex) + 1;
            } else {
              string = string.substring(0, startIndex) + string.substring(dotOrNonZero);
              posChange = (position - pointIndex);
              deltaE = pointIndex - dotOrNonZero - 1;
            }
            
            if (exponentIndex >= 0) {
              exponentIndex -= posChange;
            }
            position -= posChange;
            last -= posChange;

            // hack so we can use pointIndex to change the newExponent.
            pointIndex = deltaE + position;
          }
        } else {
          position ++;
          string = string.substring(0, position) + '.' + string.substring(position);
          string = string.substring(0, pointIndex + 1) + string.substring(pointIndex + 2);
        }
        newExponent += (pointIndex - position);

        // 12|345
        if (exponentIndex < 0) {
          exponentIndex = last + 1;
        }
        // If e is used already in this token (becaused we moved the cursor)
        // we should not lose accuracy, but move the cursor to where e already was.
        
        // Helpfully, we're going to remove what the user is about to correct,
        // i.e. the existing exponent. 
        // we could be more helpful. See schemes above.

        // remove everything upto (and including) the existing e.
        string = string.substring(0, exponentIndex) + newExponent + string.substring(last + 1);
        insertionPoint = exponentIndex;
        position = exponentIndex + (newExponent + '').length - 1;
      }
    } else if (token.type === 'point') {
      // Look for a pre-existing token. If we find one, then remove it.
      // This keeps the accuracy, and saves the user some cursor wrangling.
      pointIndex = indexOfChar(string, '.', node._offsetLiteralFirst, node._offsetLiteralLast);
      if (pointIndex >= 0) {
        string = string.substring(0, pointIndex) + string.substring(pointIndex+1);
      }
      insertionPoint = position + 1;
    }

    newString = string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);

    var cursorPosition;
    if (clipCursorToToken) {
      cursorPosition = insertionPoint + token.key.length;
    } else {
      // The 'position' refers to the offset of the character 
      // directly after the cursor is rendered, as if the 
      // cursor is a character.
      // i.e. cursorPosition = cursorPosition + token length
      cursorPosition = position + 1 + token.key.length;
    }

    return {
      string: newString,
      cursorPosition: cursorPosition
    };
  },

  visitIdentifier: function(node, position, ctx) {
    var token = ctx.token,
        string = ctx.string;
    var insertionPoint;

    if (position <= node.offsetFirst) {
      insertionPoint = position;
    } else if (position <= node.offsetLast) {
      insertionPoint = node.offsetFirst;
    } else {
      return "BAD_IDENTIIER: " + chip(string, position);
    }

    // TODO is the integer node in brackets?

    return string.substring(0, insertionPoint) + token.key + string.substring(insertionPoint);
  },

  visitUnitLiteral: function (node, position, ctx) {
    return ctx.valueNode.accept(this, position, ctx);
  },

  visitUnitPower: function(node, position, ctx) {
    return ctx.valueNode.accept(this, position, ctx);
  },

  visitUnitMultOp: function(node, position, ctx) {
    return ctx.valueNode.accept(this, position, ctx);
  },

});


/************************************************************
  ExpressionEditor
/************************************************************/

function ExpressionEditor() {
}

var _prototype = ExpressionEditor.prototype;

// stateless
var condemnedTokenFinder = new CondemnedTokenFinder(),
    tokenDeleter = new TokenDeleter(),
    luckyTokenFinder = new InsertionTokenFinder(),
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
        endString = expressionString.substring(cursorPosition),
        oldStringLength = expressionString.length;

    var obj = {
      string: beginString + token.key + endString,
      cursorPosition: cursorPosition + token.key.length
    };
    if (!node || !expressionString) { // expressionString === ''
      return obj;
    }
    switch (token.type) {
      case 'unit':
        if (expressionString[cursorPosition - 1] !== '/') {
          beginString += ' ';
        }
        break;
      case 'prefixOp':
      case 'parensOpen':
      case 'point':
      case 'exponent':
        return this._insert(expressionString, node, token, cursorPosition);
      default:
        
    }
    var newString = beginString + token.key + endString;
    obj = {
      string: newString,
      cursorPosition: cursorPosition + (newString.length - oldStringLength)
    };
    return obj;
  },

  _insert: function (expressionString, node, token, ogCursorPosition) {
    var cursorPosition = ogCursorPosition, 
      ast = node.expression(),
      prevLength = expressionString.length;

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
      editor: tokenInserter,
      token: token,
    };

    if (cursorPosition >= expressionString.length) {
      cursorPosition = expressionString.length;
    }

    var astNode, insertPoint, excisionPoint;
     
    if (false && ctx.considerBrackets) {
      // if the user has just typed a close parens
      // we can find out the ASTNode that those parens belonged to.
      expressionString = ast.accept(luckyTokenFinder, cursorPosition - 1, ctx);
      
      // // we're going to insert at the beginning of the astNode.
      // insertPoint = astNode.offsetFirst;
      
      // // skipping the existing open parens '(' if the token will supply its own.
      // excisionPoint = insertPoint;
      // if (token.key.indexOf('(') >= 0) {       
      //   excisionPoint = insertPoint + 1;
      // }

      // expressionString = expressionString.substring(0, insertPoint) + token.key + expressionString.substring(excisionPoint);
    } else {
      // the user has typed something, but not a close parens
      // BUT we have the AST, so we know that it resulted in a successful expression.
      // The last successful token the user pressed is contained in this node:

      expressionString = ast.accept(luckyTokenFinder, cursorPosition - 1, ctx);

      // it could be any number of things:
      // A Terminal: if the cursor is in the middle of an integer, it would be cool to remove an existing dot or exponent.
      // An operator node, some where in the middle of the operator literal (or padding) itself.
      // A unit, unitPer or unitPow
      // node.inBrackets may be true, and this will affect node.offsetFirst. 
    }

    var obj;
    if (typeof expressionString === 'string') {
      obj = {
        string: expressionString,
        cursorPosition: cursorPosition + (expressionString.length - prevLength)
      };
    } else {
      obj = expressionString;
    }

    return obj;
  },

  delete: function (expressionString, node, cursorPosition, isValidExpression) {
    if (!isValidExpression && cursorPosition === 0) {
      // It's not clear what we should do here, 
      // but we don't want to leave the expression in valid for very long
      // so we should do the least damaging thing to move it towards a valid state.
      return {
        string: expressionString.substring(1),
        cursorPosition: 0,
      };
    }
    return this._delete(expressionString, node, cursorPosition);
  },

  _delete: function (expressionString, node, cursorPosition) {
    // expressionString: manadatory.
    // node - the result of evaluating expressionString. At this point, it is known that expressionString is parsable.
    // cursorPosition is the last known position of the cursor
    var ast = node.expression(),
        obj;
    obj = {
      string: expressionString,
      cursorPosition: cursorPosition
    };

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
      obj = ast.accept(condemnedTokenFinder, cursorPosition - 1, ctx);
      if (typeof obj === 'string') {
        obj = {
          string: obj,
          cursorPosition: cursorPosition + (obj.length - expressionString.length)
        };
      }
      return obj;
    } else {
      return obj;
    }
  },

});

module.exports = {
  ExpressionEditor: ExpressionEditor
};