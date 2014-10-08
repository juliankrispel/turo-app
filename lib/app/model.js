"use strict";

var _ = require("underscore"),
  EventEmitter = require('events').EventEmitter,
  turo = require("turo"),
  Turo = turo.Turo,
  output = require("./to-html"),
  editable = require('./to-editable-html');

/*
 * TODO Refactor This is way too much UI in the model.
 */
var monkeyPatch_valueToHtml = function (prefs) {
  this._calculateValue(prefs);
  return output.toString(this.value(), undefined, prefs);
};

var monkeyPatch_expressionToHtml = function (literals, prefs) {
  if (this.parseError) {
    return this.src;
  }
  return output.toString(this.expression(), literals, prefs);
};

var monkeyPatch_expressionToEditableHtml = function (literals, prefs) {
  if (this.parseError) {
    return this.src;
  }
  return editable.toString(this.expression(), literals, prefs);
};


var Statement = function(result){
  this.result = result;
};

_(Statement.prototype).extend(EventEmitter.prototype, {

  toString: function () {
    return this.result.toSource();
  },

  toHtml: function(){
    return this.result.toHtml();
  },

  expressionToString: function (literals) {
    if (!this.result || !this.result.ast || this.result.ast.statementType) {
      return this.src;
    }
    return this.result.expressionToString(literals);
  },

  expressionErrors: function () {
    return this.result.expressionErrors();
  },

  _expresssionWithRenderer: function (literals, prefs, renderer) {
    if (prefs) {
      prefs = _.defaults(prefs, this.result.turo.prefs());
    } else {
      prefs = this.result.turo.prefs();
    }
    return renderer.toString(this.result.expression(), literals, prefs);
  },

  expressionToHtml: function (literals, prefs) {
    return this._expresssionWithRenderer(literals, prefs, output);
  },

  expressionToEditableHtml: function (literals, prefs) {
    return this._expresssionWithRenderer(literals, prefs, editable);
  },

  // TODO Refactor This is way too much UI in the model.
  valueToHtml: function (prefs) {
    if (prefs) {
      prefs = _.defaults(prefs, this.result.turo.prefs());
    } else {
      prefs = this.result.turo.prefs();
    }
    return output.toString(this.result.value(), undefined, prefs);
  },

  valueToString: function () {
    return this.result.valueToString();
  },

  identifierToString: function () {
    return this.result.identifierToString();
  },

  identifierErrors: function () {
    return this.result.identifierErrors();
  },
});

var Model = function(_turo, statements, id2Indexes) {
  this.turo = _turo || new Turo({
    formatComma: ",",
    precisionType: "sf",
    precisionDigits: 10
  });
  this.statements = statements || [];
  this.indexes = id2Indexes || this._rebuildIndexes();
  this.identifiers = {};
  this.selected = null;

  this._nextId = 0;

  _(this).bindAll('removeStatement');
};

_.extend(Model.prototype,
  EventEmitter.prototype,
  {
    putStatement: function (string, name, i) {
      var id;
      if (i !== undefined && this.statements[i]) {
        // Use the existing identifier if one is specified.
        id = this.statements[i].id;

        // now look for opportunities to rename and delete.

        var oldIdentifier = this.statements[i].result.identifier(),
        newIdentifier = name;

        if (oldIdentifier) {
          // Do this now, before eval because turo knows what the old variable was up.
          if (!newIdentifier) {
            this.turo.removeVariable(oldIdentifier);
          } else if (newIdentifier !== oldIdentifier) {
            this.renameVariable(oldIdentifier, newIdentifier);
          }
        }
      }
      if (id === undefined) {
        id = this._nextId++;
      }

      var result = this._evaluateString(string, name, id);
      var statement = this._commitStatement(result, i);
      statement.src = result.src;

      this.emit('onChange', statement);

      return statement;
    },

    reset: function () {
      _.each(this.statements, function (statement) {
        statement.removeAllListeners();
      });
      this.removeAllListeners();
    },

    include: function (name) {
      this.turo.include(name);
      return this;
    },

    _evaluateString: function (string, name, id) {
      var src = (name) ? (name + " = " + string) : string,
          result;

      result = this.turo.evaluate(src, undefined, id);
      // not sure if we want this to be the expression or the variable definition.
      result.src = src;
      result.valueToHtml = monkeyPatch_valueToHtml;
      result.expressionToHtml = monkeyPatch_expressionToHtml;
      result.expressionToEditableHtml = monkeyPatch_expressionToEditableHtml;
      return result;
    },

    getSelectedStatement: function(string){
      return this._getStatement(this.selected);
    },

    /**
    * Reinsert statement back into the model.
    *
    * The statement choses where in the statements list
    * it will end up.
    *
    * The caller can overide the position in the model by
    * using a numerical index, i.
    *
    * If nothing sensible can done, append to the list.
    *
    */
    _commitStatement: function (result, i) {

      //assert typeof i === 'number';
      //assert typeof statement.id == 'number';

      var numStatements = this.statements.length;
      if (typeof i !== "number") {
        var existing = this.indexes[result.id];
        if (existing !== undefined) {
          i = this.indexes[existing];
        } else {
          i = numStatements;
        }
      }

      var statement;
      if (i === undefined || i > numStatements) {
        i = numStatements;
      } else if (i < 0) {
        i = 0;
      }

      if (i === numStatements) {
        statement = new Statement(result);
        this.statements.push(statement);
      } else {
        statement = this.statements[i];
        statement.result = result;
      }

      this.indexes[result.id] = i;
      statement.index = i;
      statement.id = result.id;

      // Process consequents here.

      this._processCascade(result);

      return statement;
    },

    _processCascade: function (result) {
      var consequents = result.consequents(),
      self = this;
      _(consequents).each(function (r) {
        var index = self.indexes[r.id],
        s = self.statements[index];
        s.index = index;
        r.index = index;
        s.result = r;
        // the list items listen on this one
        s.emit("onModelChanged");
      });
    },

    evaluateString: function (string, name, index) {
      var statement, id;
      if (index !== undefined) {
        if (typeof index === 'number') {
          statement = this.statements[index];
        } else if (index.result) {
          statement = index;
        }
        id = statement.id;
      }


      var result = this._evaluateString(string, undefined, id);

      if (statement) {
        result.index = statement.index;
        result.id = statement.id;

      }

      var declared;
      if (name) {
        result._identifier = name;

        // Make sure the parser agrees this is a valid identifier.
        // This will make using the native soft keyboard more acceptable.
        try {
          this.turo.parser.parse(name, "IdentifierLiteral");
        } catch (e) {
          result._identifierErrors = [e];
          return result;
        }

        declared = this.turo.variables.getVariableDefinition(name);
        if (declared && declared.id !== id) {
          result._identifierErrors = [new turo.Error("DUPLICATE_VARIABLE_DEFINITION")];
        }

      }
      return result;
    },

    renameVariable: function (oldName, newName) {
      this.turo.renameVariable(oldName, newName);
    },

    getStatements: function () {
      return this.statements;
    },

    getStatementWithId: function (id) {
      var index = this.indexes[id];
      if (index !== undefined) {
        return this._getStatement(index);
      }
    },

    getTokenPredictor: function () {
      return this.turo.getTokenPredictor();
    },

    _getStatement: function (i) {
      return this.statements[i];
    },

    swapStatements: function (i, j) {
      var im = this.indexes,
      s = this.statements,
      tmp;

      // the indexes track the id => index mapping.
      im[s[i].id] = j;
      im[s[j].id] = i;

      // actually do the swap
      tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;

      // update the indexes
      s[i].index = i;
      s[j].index = j;

      this.emit('onChange');
    },

    removeStatement: function(index) {
      // TODO do we have to make sure this is an int?
      index = parseInt(index);

      var i, max = this.statements.length - 1,
      removed = this.statements[index],
      im = this.indexes;

      if (!removed) {
        return;
      }

      var result = removed.result;

      // and remove ourselves from any statements we're listening to,
      // and from the variables object.
      result.dispose();

      // now re-evaluate the consequents cascade.
      this._processCascade(result);


      // Delete the statement from the list.
      this.statements.splice(index, 1);

      // Now to maintain the map of ids -> indexes
      delete im[removed.id];

      for (i = index; i < max; i++) {
        var statement = this.statements[i];
        im[statement.id] = statement.index = i;
      }

      // If we'd selected this statement,
      // then we should not be selecting anything.
      if (this.selected === index) {
        this.selected = null;
      }

      // we should tell it that it's not part of the list anymore
      delete removed.index;

      // Tell all the things.
      this.emit('onStatementRemoved', index);
      this.emit('onChange');
    },

    _rebuildIndexes: function () {
      var s = this.statements,
      im = this.indexes = {},
      i = 0, max = s.length;

      for (; i < max; i++) {
        im[s[i]] = i;
        s[i].index = i;
      }

      return im;
    },

    pinStatement: function (i) {

    },

    unpinStatement: function (i) {

    },


  });

module.exports = Model;
