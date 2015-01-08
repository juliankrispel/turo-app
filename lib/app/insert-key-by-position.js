'use strict';

var _ = require('underscore'),
    turo = require('turo'),
    ast = turo.ast;



function chip(string, cursorPosition) {
  return string.substring(0, cursorPosition) + '|' + string.substring(cursorPosition);
}
////////////////////////////////////////////////////////////////////


function NodeInserter () {

}

_.extend(NodeInserter.prototype, {

  insertKeyIntoNode: function (node, cursorPosition, ctx) {
    var token = ctx.keyObject;
    if (token.type === 'prefixOp' || token.type === 'parensOpen') {
      return this._typePrefixOp(node, cursorPosition, ctx, undefined, true);
    } else if (token.type === 'postfixOp') {
      return this._typePrefixOp(node, cursorPosition, ctx, undefined, false);
    }
  },

  _typePrefixOp: function(node, cursorPosition, ctx, literal, isPrefix) {
    if (_.isNaN(cursorPosition)) {
      // throw new Error('Cursor is NaN');
      cursorPosition = node.literal.length;
    }
    literal = literal || ctx.keyObject.key;

    

    var clone = node.clone(),
        opNode = new ast.UnaryOperationNode(clone, literal, isPrefix);

    // Move the unit node from the terminal to the 
    // unary operator. 
    // This allows: 12 m|! -> 12! m
    // TODO parser nor operations support this.
    opNode.unitNode = clone.unitNode;
    opNode.unitLiteral = clone.unitLiteral;

    delete clone.unitNode;
    delete clone.unitLiteral;

    // Next, put the cursor at the end of the cloned node.
    // This is relative to the old cursor positions.
    cursorPosition = node.offsetLast;
    
    ctx.cursorPosition = cursorPosition;
    // Do this here so that it isn't lazily calculated for us,
    // and we can calculate it based on tokens from this tree
    // in editable-expression.js
    // TODO when we have more postfix operators, worry about this more.
    if (!isPrefix) {
      opNode._offsetLiteralFirst = cursorPosition;
      opNode._offsetLiteralLast = cursorPosition + literal.length;
    } else {
      opNode._offsetFirst = -1;
      opNode._offsetLast = -1;
    }


    return opNode;
  },

  ////////////////////////////////////////////////////////////////////
  // This is the entry point from the finder.
  // Handles the general case, then exceptions. 


  visitNonMatchingChildren: function (node, childNames, cursorPosition, ctx) {
    return this.insertKeyIntoNode(node, cursorPosition, ctx);
  },

  visitInteger: function(node, cursorPosition, ctx) {
    // This is just for unitPower calls. 2 m^3. If we are '2', valueNode is undefined, '3' points to '2'.
    if (node.valueNode) {
      return node.valueNode.accept(this, cursorPosition, ctx);
    }

    return this.insertKeyIntoNode(node, cursorPosition, ctx);
  },

  visitParens: function (node, cursorPosition, ctx) {
    if (ctx.keyObject.type === 'prefixOp') {
      var literal = ctx.keyObject.key;
      var parensOpen = literal.indexOf('(');
      if (parensOpen >= 0) {
        literal = literal.substring(0, parensOpen);
      }
      return this._typePrefixOp(node, cursorPosition, ctx, literal, true);
    }
    return this.insertKeyIntoNode(node, cursorPosition, ctx);
  }

});




////////////////////////////////////////////////////////////////////

function NodeFinder () {

}

_.extend(NodeFinder.prototype, {

  // This is the heart of the recursion.
  _replaceMaybe: function (parent, childName, position, ctx, clone, child) {
    if (!child) {
      child = parent[childName];
      if (!child) {
        return clone;
      }
    }
    var result = child.accept(this, position, ctx);

    // if the result is different to the child, then we should
    // clone this node and re-attach the new child. 
    // Thus trees are immutable.
    if (result !== undefined &&
      child !== result &&
      result.accept) {
      clone = clone || parent.clone();
      clone[childName] = result;
    }
    return clone;
  },

  visitNonMatchingChildren: function (node, childNames, position, ctx) {
    ctx.parent = node;
    var clone, 
        self = this;

    // Only looking for children that exist.
    childNames = _.filter(childNames, function (name) {
      return !!node[name];
    });

    if (childNames.length === 0) {
      return self.terminalMatch(node, position, ctx);
    }

    
    function replaceMaybe(childName, child) {
      clone = self._replaceMaybe(node, childName, position, ctx, clone, child);
    }

    // Loop through the children, in reverse order.
    // Trailing space is awarded to the preceding token.
    var lastChild = childNames[childNames.length - 1];
    if (position > lastChild.offsetLast) {
      replaceMaybe(lastChild, node[lastChild]);
    } else {
      for (var i=childNames.length - 1; i >= 0; i--) {
        var childName = childNames[i];
        var child = node[childName];
        if (child.offsetFirst < position) {
          replaceMaybe(childName, child);
          break;
        }
      }
    }

    if (!clone) {
      return self.nonTerminalMatch(node, position, ctx);
    }

    return clone || node;
  },

  visitBinaryOperator: function (node, position, ctx) {
    if (position > node._offsetLiteralLast) {
      return this._replaceMaybe(node, 'right', position, ctx) || node;
    } else if (position <= node._offsetLiteralFirst) {
      return this._replaceMaybe(node, 'left', position, ctx) || node;
    } else {
      return this.nonTerminalMatch(node, position, ctx);
    }
  },

  visitParens: function (node, position, ctx) {
    if (node.offsetFirst < position && position <= node.offsetLast) {
      return this._replaceMaybe(node, 'ast', position, ctx) || node;
    } else {
      return this.nonTerminalMatch(node, position, ctx) || node;
    }
  },

  visitUnaryOperation: function (node, position, ctx) {
    if ((node.isPrefix && position >= node.value.offsetFirst) ||
        (!node.isPrefix && position <= node._offsetLiteralFirst)) {
      return this._replaceMaybe(node, 'value', position, ctx);
    }
    return this.nonTerminalMatch(node, position, ctx);
  },

  terminalMatch: function (node, position, ctx) {
    var visitor = ctx.visitor;
    return node.accept(visitor, position, ctx);
  }, 

  nonTerminalMatch: function (node, position, ctx) {
    return this.terminalMatch(node, position, ctx);
  },


  visitInteger: function(node, position, ctx) {
    // We don't care about units in the cases we're dealing with here
    // If we did, then we'd call 
    // this._replaceMaybe(node, 'unitNode', position, ctx);
    return this.terminalMatch(node, position, ctx);
  },

  visitIdentifier: function(node, position, ctx) {
    return this.terminalMatch(node, position, ctx);
  },

  visitUnitLiteral: function (node, position, ctx) {
    return this.terminalMatch(node, position, ctx);
  },

});



////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////

var finder = new NodeFinder(),
    inserter = new NodeInserter();

function insert(node, keyObject, cursorPosition) {

  var ctx = {
    keyObject: keyObject,
    visitor: inserter
  };

  var retNode = node.accept(finder, cursorPosition, ctx);
  if (ctx.cursorPosition === undefined) {
    throw new Error('No cursor position');
  }
  retNode.cursorPosition = ctx.cursorPosition;
  return retNode;
}


module.exports = {
  insert: insert,
};