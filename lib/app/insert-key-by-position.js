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

  _typePrefixOp: function(node, cursorPosition, ctx) {
    if (_.isNaN(cursorPosition)) {
      // throw new Error('Cursor is NaN');
      cursorPosition = node.literal.length;
    }
    var literal = ctx.keyObject.key;

    // there is no hard and fast rule about this.
    // I don't like the idea of calculating the cursor position 
    // like this.
    ctx.cursorPosition = cursorPosition + literal.length;

    return new ast.UnaryOperationNode(node.clone(), literal, true);
  },

  visitNonMatchingChildren: function (node, childNames, cursorPosition, ctx) {
    if (ctx.keyObject.type === 'prefixOp') {
      return this._typePrefixOp(node, cursorPosition, ctx);
    }
  },

  visitInteger: function(node, cursorPosition, ctx) {
    // This is just for unitPower calls. 2 m^3. If we are '2', valueNode is undefined, '3' points to '2'.
    var token = ctx.keyObject;

    if (node.valueNode) {
      return node.valueNode.accept(this, cursorPosition, ctx);
    }

    if (token.type === 'prefixOp' || token.type === 'parensOpen') {
      return this._typePrefixOp(node, cursorPosition, ctx);
    }
  },

  visitParens: function (node, cursorPosition, ctx) {
    var literal = ctx.keyObject.key;
    if (ctx.keyObject.type === 'prefixOp') {
      var parensOpen = literal.indexOf('(');
      if (parensOpen >= 0) {
        literal = literal.substring(0, parensOpen);
      }
      return this._typePrefixOp(node, cursorPosition, ctx);
    }

  }

});




////////////////////////////////////////////////////////////////////

function NodeFinder () {

}

_.extend(NodeFinder.prototype, {
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

    // This is the heart of the recursion.
    function replaceMaybe(childName, child) {
      var result = child.accept(self, position, ctx);

      // if the result is different to the child, then we should
      // clone this node and re-attach the new child. 
      // Thus trees are immutable.
      if (result !== undefined &&
        child !== result &&
        result.accept) {
        clone = clone || node.clone();
        clone[childName] = result;
      }
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

  visitParens: function (node, position, ctx) {
    if (position > node.offsetFirst) {
      return this.nonTerminalMatch(node, position, ctx);
    } else {
      return this.visitNonMatchingChildren(node, ['ast'], position, ctx);
    }
  },

  terminalMatch: function (node, position, ctx) {
    var visitor = ctx.visitor;
    return node.accept(visitor, position, ctx);
  }, 

  nonTerminalMatch: function (node, position, ctx) {
    return this.terminalMatch(node, position, ctx);
  },


  visitInteger: function(node, position, ctx) {
    return this.visitNonMatchingChildren(node, ['unitNode'], position, ctx);
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

  return node.accept(finder, cursorPosition, ctx);
}


module.exports = {
  insert: insert,
};