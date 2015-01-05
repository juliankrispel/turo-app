'use strict';

var _ = require('underscore'),
    toSource = require('turo').toSource,
    injected = {};

///////////////////////////////////////////////////////////////////


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
        index = 0;
        condemnedIndex = 0;
        condemnedToken = tokenArray[condemnedIndex];
      }
    }

    if (!condemnedToken) {
      throw new Error('No token to delete');
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






    /*
       tokenArray, cursorPosition. 

       Find token position.
       

      1 + si|n(4) => 1 + |(4)
        Delete the token.

      1 + sin(|4) => 1 + sin| 4
        Find the paired bracket tokens
        Delete tokens


      1.23|456 => 1.2|456


      1.|
      2e-|
     */

    return new EditableExpression(newTokenArray, newCursorPosition);
  },

  moveCursor: function (pos) {
    return new EditableExpression(this.tokenArray, pos);
  },

  calculate: function () {

    var turo = this._turo;

    // We have a potentionally parseable expression.
    var expressionString = this.toString();

    if (this._postEditCursorToken) {
      var tokenLength = this._postEditCursorToken.tokenLength || 0;
      this.cursorPosition = this._postEditCursorToken.startOffset + tokenLength;
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

      this.evalNode = result;
      this.evalValue = value;

      this.tokenArray = toSource.toTokenArray(result.expression(), {editable: true});
    } else {
      // XXX side effects.
      this.evalNode = null;
      this.evalValue = null;
      toSource.toString(this.tokenArray);
    }
    this.isParseable = isParseable;

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

  insert: function (keyObject) {

    // We need node we can insert into.

    if (this.isParseable) {
      switch (keyObject.literal) {
        case '1/':
          break;
      }

      switch (keyObject.type) {
        case 'prefixOp':
          return this._insertByPosition(keyObject);
      }
    }

    return this._insertWithTokens(keyObject);
    /*
      1 m^2 in km $unit|
      1 m^2 in km

    
          in
         /  \
        *    $unit
       / \
       1  m


      1 m in km
    */

    // We produce a tokenArray, and a cursor position.
    // We may also have a parseable expression, and a result.
  },

  _insertByPosition: function (keyObject) {
    var inserter = require('./insert-key-by-position');

    var node = this.evalNode.ast, 
        newNode;
    newNode = inserter.insert(node, keyObject, this.cursorPosition);

    if (newNode === undefined || newNode === node) {
      throw new Error('No inserting ' + keyObject.key);
      //return this._insertWithTokens(keyObject);
    }

    return new EditableExpression(toSource.toTokenArray(newNode), this.cursorPosition, this);
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
      insertedToken = newToken;
      newTokenArray = newTokens;
    }

    if (!insertedToken.literal) {
      throw new Error('No literal available: ' + JSON.stringify(keyObject));
    }

    insertedToken.tokenLength = insertedToken.literal.length;
    return new EditableExpression(newTokenArray, insertedToken, this);
    
  },

  toString: function () {
    var expression = this._expressionString;
    if (!expression) {
      expression = toSource.toString(this.tokenArray);
      if (this.isParseable) {
        this._expressionString = expression;
      }
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
});


module.exports = {
  inject: function (obj) {
    injected = obj;
  },

  EditableExpression: EditableExpression,
};
