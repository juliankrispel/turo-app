'use strict';
var _ = require('underscore'),
    turo = require('turo'),
    Turo = turo.Turo,
    ast = turo.ast,
    TuroNumber = turo.TuroNumber;

function Model (turo) {
  this.turo = turo;
}


_.extend(Model.prototype, {

  resetContext: function () {
    this.turo = new Turo();
    this.turo.include('app');
    return this;
  },

  evaluateNode: function (node) {
    var num = this.turo.evaluateNode(node);
    return new TuroNumber(num, node.unit, node.valueType);
  },

  parseDocument: function (stringDoc) {

    // reset the context
    // var context = turo.newContext();

    this.resetContext();

    // parse the document

    function numValidStatements (doc) {
      var count = 0;
      _.each(doc.lines, function (line) {
        if (line.accept) {
          count ++;
        }
      });
      return count;
    }

    var firstParse = this.turo.parse(stringDoc + '\n', 'EditorText');

    
    var doc = this.turo.parse(stringDoc + '\n', 'EditorText'),
        lines = doc.lines;

    // we need to ensure that each line has an id.
    // it should match the id of the line we are parsing.
    // TODO: All this bullshit goes away if we have a newContext.

    var nextId = 1000;
    _(lines).each(function (line) {
      line.id = nextId ++;
    });

    if (numValidStatements(doc) !== numValidStatements(firstParse)) {
      console.log('TODO: implement re-ordering');
    }

    doc.lines = lines;

    this.documentNode = doc;

    // actually evaluate everything.
    var value, line, values = [];

    for (var i=0, max=lines.length; i < max; i++) {
      var node = lines[i];
      if (!node.accept) {
        continue;
      }

      value = this.evaluateNode(node);
      
      node.currentValue = TuroNumber.newInstance(value, node.unit, node.valueType);

      values.push(value);
    }

    return values;
    // tell all the statements that updated that they updated
  },

  findLineAtCursor: function (lines, cursorPosition) {
    var statementIndex = _.sortedIndex(lines, cursorPosition, function (x) {
      if (_.isNumber(x)) {
        return x;
      }
      if (x.offsetLineStart < cursorPosition && cursorPosition < x.offsetLineEnd) {
        return cursorPosition;
      }
      return x.offsetLineStart;
    });
    return statementIndex;
  },

  parseSingleStatement: function (string) {
    // TODO: rename method. we are doing much more than parsing here.
    var currentStatement = this._currentStatement;

    var newResult = this.turo.evaluate(string, undefined, currentStatement.id),
        node = newResult.ast;

    if (!node) {
      node = new ast.UnparsedText(string, currentStatement.offsetLineStart, currentStatement.lineLast);
    } else {
      var results = newResult.consequents();
      _.each(results, function (r) {
        var v = r.value();
        console.log('v.number = ' + v.value);
        console.log(v);
        r.ast.currentValue = TuroNumber.newInstance(v.value, v.unitLiteral, v.valueType);
      });
    }



    // 
    
  },

  moveCursor: function (cursorPosition) {
    var doc = this.documentNode,
        statementIndex = this.findLineAtCursor(doc.lines, cursorPosition),
        currentStatement = doc.lines[statementIndex];
    this._currentStatement = currentStatement;
    this._statementIndex = statementIndex;
  },

  emitStatementUpdate: function (line) {},

  emitBatchStatementUpdate: function (lines) {},

});

/////////////////////////////////////////////////////////////////////////////////////
Object.defineProperties(Model.prototype, {
  results: {
    get: function () {
      return _.pluck(this.documentNode.lines, 'currentValue');
    },
  }
});

/////////////////////////////////////////////////////////////////////////////////////

// from http://stackoverflow.com/a/1917041/4737
function longestCommonPrefix (array) {
  var sortedArray= array.slice(0).sort(), 
      
      word1 = sortedArray[0], 
      word2 = sortedArray[sortedArray.length-1], 
    
      max = word1.length, i= 0;
  
  while (i<max && word1.charAt(i)=== word2.charAt(i)) {
    i++;
  }

  return word1.substring(0, i);
}

Model.newModel = function (optionalTuroDoc) {
  
  var model = new Model().resetContext();
  if (optionalTuroDoc) {
    model.parseDocument(optionalTuroDoc, 0);
  }
  return model;
};

module.exports = Model;

