'use strict';

var _ = require('underscore'),
    toSource = require('turo').toSource,
    literals = require('./button-lookups').prettyOutput,
    injected = {},
    tokenizerOptions = {editable: true};

var defaultContext = {
  literals: literals,
};
var defaultDisplay = toSource.display;

///////////////////////////////////////////////////////////////////

var reverseLiteralTokensGenerator = function (tokenArray, index) {
  if (index === undefined) {
    index = tokenArray.length;
  }
  return function () {
    var t;

    do {
      index --;
    } while (index >= 0 && !tokenArray[index].literal);
    
    if (index >= 0) {
      return tokenArray[index];
    }

  };
};



/* TODO
   * make toSource.tokenize(editing) spit out 
*/

///////////////////////////////////////////////////////////////////
function EditableExpression (string, cursorPosition, previous) {
 
  if (!string) {
    // the empty string.
    this.tokenArray = [];
  } else if (_.isString(string)) {
    // assumtion: string is a parseable expression.
    this._expressionString = string;
  } else if (string.accept) {
    this.tokenArray = toSource.toTokenArray(string.expression(), tokenizerOptions);
  } else if (_.isArray(string)) {
    this.tokenArray = string;
  }

  if (cursorPosition === undefined) {
    // will default to the end of the string, in calculate()
  } else if (_.isNumber(cursorPosition)) {
    this.cursorPosition = cursorPosition;
  } else if (cursorPosition.literal) {
    this._postEditCursorToken = cursorPosition;
  }
  this.previous = previous;

  this.calculate();
}

_.extend(EditableExpression.prototype, {

  //////////////////////////////////////////////////////
  calculate: function () {

    var cursorToken = this._postEditCursorToken,
        cursorPosition = this.cursorPosition;

    // If this is the result of an insert, we have a numerical cursor position,
    // and also a previous (as in we've added to history) – otherwise, it's 
    // just a move of cursor, without change.
    if (cursorPosition !== undefined && !cursorToken && this.previous) {
      // We have already established it's a number.
      var tokens = this.tokenArray;
      var previousToken = reverseLiteralTokensGenerator(this.tokenArray),
          t, u;
      while ((t = previousToken())){

        
        if (t.startOffset < 0) {
          continue;
        } else if (t.startOffset + t.literal.length <= cursorPosition) {
          cursorToken = u;
          cursorToken.tokenLength = u.literal.length;
          break;
        }
        u = t;
      }
    }

    // We have a potentionally parseable expression.
    var expressionString = this.toString();

    if (cursorToken) {
      var tokenLength = cursorToken.tokenLength || 0;
      this.cursorPosition = cursorToken.startOffset + tokenLength;
      delete this._postEditCursorToken;
    }
    
    if (this.cursorPosition === undefined) {
      this.cursorPosition = expressionString.length;
    }

    // Get the result from turo.

    var result = injected.model.evaluateString(expressionString, this.identifier, this.statement),
    value = result.value();




    // Do something with the result.

    var isParseable = !(result.parseError);
    if (isParseable) {
      this.tokenArray = toSource.toTokenArray(result.expression(), tokenizerOptions);
    } else {
      // XXX side effects.
      toSource.toString(this.tokenArray);
    }
    this.isParseable = isParseable;
    this.evalResult = result;
    this.evalValue = value;

    if (!expressionString) {
      this.tokenArray = [];
    } 

    if (!this.tokenArray) {
      throw new Error('No tokenArray on calculate');
    }

    // Get the syntax tokens from the parser.
    this.tokenTypes = this._calculateTokenTypes(expressionString, this.cursorPosition);

    var insertableNode = this._createPlaceholderNode(this.tokenTypes);

    //this._calculateDimensions(insertableNode);

    // 
    return this;

  },

  //////////////////////////////////////////////////////

  delete: function () {

    if (this.previous) {
      return this.previous;
    }

    var tokenArray = this.tokenArray,
        cursorPosition = this.cursorPosition;
    
    // XXX yikes, side effects. 
    this.toString();


    var index = tokenArray.length,
        condemnedToken, precedingToken, condemnedIndex, token, t;

    // This is a pseudo generator of literal tokens, in reverse order.
    var previousToken = function () {
      var t;

      do {
        index --;
      } while (index >= 0 && !tokenArray[index].literal);
      
      if (index >= 0) {
        return tokenArray[index];
      }

    };

    token = previousToken();
    if (token) {
      if (cursorPosition >= (token.startOffset + token.literal.length)) {
        // the loop below won't find the last token, so we check here.
        condemnedToken = token;
        condemnedIndex = index;
        precedingToken = previousToken();
      } else {
        t = token;
        while (t) {
          if (cursorPosition > t.startOffset) {
            condemnedToken = t;
            condemnedIndex = index;
            precedingToken = previousToken();
            break;
          }
          t = previousToken();
        }
      }
    }

    if (!condemnedToken) { // because we're at the beginning of the string
      if (this.isParseable) {
        return this;
      }
      if (index <= 0) {
        // This won't do when we have semantic errors too.
        index = 0;
        condemnedIndex = 0;
        condemnedToken = tokenArray[condemnedIndex];
      }
    }

    if (!condemnedToken) {
      return this;
    }

    function removeTokenAt (array, index) {
      return _.flatten(
        [_.first(array, index),
        _.rest(array, index + 1)]
      );
    }

    var newTokenArray = tokenArray;

    switch (condemnedToken.displayType) {
      case 'bracketStart':
        index = tokenArray.length;
        while ((t = previousToken()) && index > condemnedIndex) {
          if (t.bracketCount === condemnedToken.bracketCount) {
            newTokenArray = removeTokenAt(newTokenArray, index);
            break;
          }
        }
        newTokenArray = removeTokenAt(newTokenArray, condemnedIndex);
        break;

      case 'bracketEnd':
        newTokenArray = removeTokenAt(newTokenArray, condemnedIndex);
        while ((t = previousToken())) {
          if (t.bracketCount === condemnedToken.bracketCount) {
            newTokenArray = removeTokenAt(newTokenArray, index);
            break;
          }
        }
        break;

      default:
        newTokenArray = removeTokenAt(newTokenArray, condemnedIndex);
    }



    if (precedingToken) {
      precedingToken.tokenLength = precedingToken.literal.length;
    }

    var newCursorPosition = precedingToken || condemnedToken.startOffset;

    return new EditableExpression(newTokenArray, newCursorPosition);
  },

  moveCursor: function (pos) {
    return new EditableExpression(this.tokenArray, pos);
  },

  
  insert: function (keyObject) {
    // We need node we can insert into.

    if (this.isParseable) {
      switch (keyObject.literal) {
        case '1/':
          break;
      }

      switch (keyObject.type) {
        case 'postfixOp':
        case 'prefixOp':
          return this._insertByPosition(keyObject);
      }
    }

    return this._insertWithTokens(keyObject);
  },

  _insertByPosition: function (keyObject) {
    var inserter = require('./insert-key-by-position');

    var node = this.evalResult.ast, 
        newNode, newTokens;
    newNode = inserter.insert(node, keyObject, this.cursorPosition);

    if (newNode === undefined || newNode === node) {
      throw new Error('No inserting ' + keyObject.key);
      //return this._insertWithTokens(keyObject);
    }
    
    newTokens = toSource.toTokenArray(newNode, tokenizerOptions);

    return new EditableExpression(newTokens, newNode.cursorPosition, this);
  },

  _insertWithTokens: function (keyObject) {
    
    var newTokenArray = [],
        insertedToken,
        cursorPosition = this.cursorPosition;

    var newToken = {
      literal: '' + keyObject.key,
      displayType: '',
    };
    var newTokens = toSource.toTokensFromKey(keyObject);

    
    if (this.tokenArray.length > 0) {
      _.each(this.tokenArray, function (t) {
        if (!insertedToken && t.startOffset >= cursorPosition) {
          _.each(newTokens, function (newToken) {
            insertedToken = newToken;
            newTokenArray.push(insertedToken);
          });
        }
        newTokenArray.push(t);
      });
      if (!insertedToken) {
        _.each(newTokens, function (newToken) {
          insertedToken = newToken;
          newTokenArray.push(insertedToken);
        });
      }
    }

    if (!insertedToken && this.tokenArray.length === 0) {
      insertedToken = newTokens[newTokens.length - 1];
      // it's -1 here, so still not really part of the string.
      insertedToken.startOffset = 0;
      newTokenArray = newTokens;
    }

    if (!insertedToken.literal) {
      throw new Error('No literal available: ' + JSON.stringify(keyObject));
    }

    insertedToken.tokenLength = insertedToken.literal.length;
    return new EditableExpression(newTokenArray, insertedToken, this);
    
  },

  toString: function (display, context) {
    context = context || defaultContext;
    if (display) {
      context.cursorPosition = this.cursorPosition;
      return toSource.joinTokenArray(this.tokenArray, display, context);
    }
    display = defaultDisplay;
    var expression = this._expressionString;
    if (!expression) {
      expression = toSource.joinTokenArray(this.tokenArray, display, context);
      this._expressionString = expression;
    }
    return expression;
  },

  _calculateTokenTypes: function (string, cursorPosition) {
    var lineToCursor = string.substring(0, cursorPosition);
    return injected.predictor.createKeyboard(lineToCursor);
  },

  _createPlaceholderNode: function (tokenTypes) {

    var string = this._expressionString;



    if (tokenTypes.unit) {

    }

  }

});

Object.defineProperties(EditableExpression.prototype, {
  
  cursorPosition: {
    get: function () {
      return this._cursorPosition;
    },

    set: function (pos) {
      this._cursorPosition = pos;
    }
  },

  evalResult: {
    get: function () {
      return this._evalResult;
    },

    set: function (result) {
      this._evalResult = result;
    }
  },
});


module.exports = {
  inject: function (obj) {
    injected = obj;
  },

  EditableExpression: EditableExpression,
};
