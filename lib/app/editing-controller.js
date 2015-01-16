var _ = require("underscore");

/************************************************************
 * Stateless helpers.
 * 
 ************************************************************/

var states = {
  APPEND_ONLY: 0,
  ENTER_PRESSED: 1,
};

var expressionEditor = require('./expression-src-editor'),
    editor = new expressionEditor.ExpressionEditor(),
    editableExpression = require('./editable-expression');



/************************************************************
 * Constructor and properties
 * 
 ************************************************************/

function Controller(calculator) {
  this.calculator = calculator;
  this.state = states.APPEND_ONLY;
  
  // defined in beginEditing.
  this._history = undefined;
  var predictor = calculator.model ? calculator.model.getTokenPredictor() : undefined;
  editableExpression.inject({
    model: this.calculator.model,
    predictor: predictor,
    editor: editor,
  });
}

Object.defineProperties(Controller.prototype, {
  $keyboard: {
    get: function () {
      return this._$keyboard;
    },

    set: function ($keyboard) {
      if (this._$keyboard) {
        // unregister for events.
      }
      this._$keyboard = $keyboard;
      if ($keyboard) {
        // register for events
      }
    }
  },
});

_.extend(Controller.prototype, {

/************************************************************
 * From UI
 * 
 ************************************************************/

  clearPressed: function() { 
    
    this.state = states.APPEND_ONLY;

    this.editableExpression = new editableExpression.EditableExpression();
    this.updateStatement("", "");
  },

  enterButtonPressed: function() {
    // We should probably just use model properly here.
    var self = this,
        string;

    if (self.state === states.ENTER_PRESSED) {
      return;
    }
    // we only do something when we have a result.
    self.state = states.ENTER_PRESSED;

    if (self.lastResult) {
      string = self.lastResult.valueToString();
      this.editableExpression = new editableExpression.EditableExpression(string);
      // Get the answer, and assign it to "Ans".
      // But on't, whatever you do, cascade the result.
      // There is likely a memory leak here, where expressions will be
      // cached against Ans.
      self.$keyboard.answer = self.calculator.model._evaluateString(string, 'Ans');
      self.$keyboard.hasAnswer = true;
      self.turoStringCursorPosition = this.editableExpression.cursorPosition;
      self.updateStatement(string, string);
    }

    
  },



  writerPressed: function(e) {
    // I'm not sure where the cursor is going to go,
    // i.e. where the character/token should end up.
    //this.$keyboard.style.background = 'red';
    var self = this;
    var key = e.key;
    var string = self.turoStringBeingEdited;

    // XXX this is because we special case prefixOp to be available when it's not.
    e.type = e.type || 'prefixOp';

    // TODO editor needs to be able to get the cursorPosition
    var lineToCursor = string; // self.$editor.lineToCursor;
    
    var isa = function isa(oneOf) {
      return _.indexOf(oneOf, e.type) >= 0;
    };
    var obj;
    if (states.ENTER_PRESSED === self.state) {
      // check classList of $button.
      var action;
      if (isa(["digits", "variable"])) {
        action = "REPLACE";
      } else if (!isa(self.enterAppendSet) && !isa(['prefixOp', 'parensOpen'])) {
        action = "REPLACE";
      }

      switch (action) {
      case "REPLACE":
        this.editableExpression = new editableExpression.EditableExpression().insert(e);
        break;
      default:
        obj = editor.append(string, this.latestValidTree, e);
        this.editableExpression = new editableExpression.EditableExpression(string, string.length).insert(e);
        break;
      }
      string = this.editableExpression.toString();
      this.turoStringCursorPosition = this.editableExpression.cursorPosition;
      //this.turoStringCursorPosition = string.length;
      lineToCursor = string;
    } else if (states.APPEND_ONLY === self.state) {
      var cursorPosition = this.turoStringCursorPosition || 0,
          prevLength = string.length || 0;

      if (!this.editableExpression) {
        this.editableExpression = new editableExpression.EditableExpression('', 0);
      }

      obj = editor.insert(string, cursorPosition, this.latestValidTree, e);
      cursorPosition = obj.cursorPosition;
      string = obj.string;
      lineToCursor = string.substring(0, cursorPosition);

      this.editableExpression = this.editableExpression.insert(e);

      string = this.editableExpression.toString();
      cursorPosition = this.editableExpression.cursorPosition;


      this.turoStringCursorPosition = cursorPosition;
      lineToCursor = string.substring(0, cursorPosition);

      // TODO editor needs to be able to set the cursorPosition
      //self.$editor.cursorPosition += cursorPosition;
      
    }

    self.state = states.APPEND_ONLY;

    // update statement uses self.state.
    self.updateStatement(string, lineToCursor);
    
  },

  deletePressed: function() {
    var self = this,
        string = self.turoStringBeingEdited,
        obj;

    if (self.state === states.ENTER_PRESSED) {
      self.clearPressed();
      return;
    }

    this.editableExpression = this.editableExpression.delete();
    string = this.editableExpression.toString();

    self.turoStringCursorPosition = this.editableExpression.cursorPosition;

    self.state = states.APPEND_ONLY;
    self.updateStatement(string);
  },

  cursorMoved: function (newPosition) {
    if (!newPosition) {
      newPosition = 0;
    } else if (newPosition >= this.turoStringBeingEdited.length) {
      newPosition = this.turoStringBeingEdited.length;
    } else if (newPosition === this.turoStringCursorPosition) {
      return;
    }
    
    this.turoStringCursorPosition = newPosition;

    this.editableExpression = this.editableExpression.moveCursor(newPosition);
    this.state = states.APPEND_ONLY;
    this.updateDisplay();
  },

  cycleUnitScheme: (function () {
    return function () {
      var turo = this.calculator.model.turo,
          prefs = turo.prefs(),
          index = prefs.unitSchemeIndex || 0,
          unitSchemes = turo.units.unitSchemes,
          schemeNames = unitSchemes.getUnitSchemes();

      if (index >= schemeNames.length) {
        prefs.unitScheme = null;
        prefs.useUnitRefactor = false;
        prefs.simpleUnits = true;
        index = 0;
      } else {
        prefs.unitScheme = schemeNames[index];
        prefs.simpleUnits = true;
        index ++;
      }

      this.$keyboard.unitScheme = prefs.unitScheme;

      this.refreshAnswerUi();

      prefs.unitSchemeIndex = index;
    };
  }()),


/************************************************************
 * 
 ************************************************************/

  refreshAnswerUi: function () {
    var self = this,
        string;

      // Get the answer, and assign it to "Ans".
      // But on't, whatever you do, cascade the result.
      // There is likely a memory leak here, where expressions will be
      // cached against Ans.
    self.$keyboard.answer = self.calculator.model._evaluateString('Ans');
    if (self.lastResult) {
      this.updateDisplay();
    }
  },

  beginEditing: function(statement) {
    if (!statement) {
      this.commitEdit();
    }
    this.statement = statement;

    this.$keyboard.active = !!statement;

    if (statement && statement.result.ast) {
      var src = statement.result.ast;

      this.editableExpression = new editableExpression.EditableExpression(src);

      this.identifier = statement.result.identifier;
    } else {
      this.editableExpression = new editableExpression.EditableExpression();
    }
    this.updateStatement();
  },

  updateDisplay: function () {
    this.updateStatement(this.turoStringBeingEdited);
  },

  updateStatement: function(fullLine, lineToCursor) {
    var expression = fullLine,
        predictor = this.calculator.model.getTokenPredictor();


    expression = this.editableExpression.toString();
    this.turoStringCursorPosition = this.editableExpression.cursorPosition;

    this.turoStringBeingEdited = expression;

    if (this.turoStringCursorPosition === undefined) {
      this.turoStringCursorPosition = expression.length;
    }

    if (lineToCursor === undefined) {
      lineToCursor = expression.substring(0, this.turoStringCursorPosition);
    }

    // TODO make sure we get to hear about this identifier changing
    var result = this.calculator.model.evaluateString(expression, this.identifier, this.statement),
        value = result.value();

    var layout;
    var hasUnits;
    
    if (states.ENTER_PRESSED === this.state) {
      var emptySet = predictor.createKeyboard("");
      var appendSet = predictor.createKeyboard(lineToCursor);
      
      
      this.enterAppendSet = _.keys(appendSet);

      layout = _.extend({}, emptySet, appendSet);
    } else {
      layout = predictor.createKeyboard(lineToCursor);
    }

    if (value) {
      hasUnits = (!!value.unit);
    }

    this.updateStatementUi(layout, result, hasUnits);

    if (!result.expressionErrors()) {
      this.lastResult = result;
    }

    if (!result.parseError) {
      this.latestValidTree = result;
    } else {
      delete this.latestValidTree;
    }
  },

  refreshUi: function () {
    this.updateStatement(this.turoStringBeingEdited);
  },

  updateStatementUi: function (tokenMap, result, hasUnits) {
    // For the web version, there is a dependence: 
    // hasUnits doesn't get rendered until layout is set.
    if (hasUnits !== undefined) {
      this.$keyboard.hasUnits = hasUnits;
    }

    var layout = _.keys(tokenMap);
    
    // Horrible hack to get the ans button showing only if we have an answer.
    if (this.hasAnswer) {
      layout.push("ans");
    }
    if (hasUnits) {
      layout.push("has-units");
    }
    
    this.$keyboard.layout = layout;
    this.$editor.updateDisplay(this.editableExpression);
  },

  commitEdit: function() {
    if (!this.statement) {
      return;
    }

    this.calculator.model.putStatement(this.turoStringBeingEdited, this.identifier, this.statement.index);

    this.finishEditing();
  },

  finishEditing: function() {
    // can we remove events?
    this.statement = null;
  }
});


module.exports = {
  Controller: Controller
};
