"use strict";

var _ = require('underscore'),
  EventEmitter = require('events').EventEmitter,
  application = require('../app/turo-application'),
  output = require('../app/to-editable-html'),
  buttons = require('./button-lookups'),
  isUnderTest = false,
  testPadding;


/***************************************************************/
var stringTimes = function (string, times) {
  var s = "";
  for (var i=0; i<times; i++) {
    s += string;
  }
  return s;
};
/***************************************************************/

var EditorController = function EditorController($native) {
  if ($native) {
    this.onLoad($native);
  }
  this._numberDisplayPrefs = {
    useUnitRefactor: true,
    index: 0,
  };
};

EditorController.prototype = new EventEmitter();

_.extend(EditorController.prototype, {
    onLoad: function ($native) {
      this.$native = $native;
      this.editor = application.editor;
      this.editor.$editor = this;
    },

    onResume: function () {
      
    },

    onUnload: function () {
      this.editor.$editor = null;
      this.editor = null;
      this.$native = null;
    },

    beginEditingIdentifier: function () {
      // unused, but for toggling between input fields.
    },

    beginEditingExpression: function () {
      // unused, but for toggling between input fields.
    },

    cycleUnitScheme: function () {
      this.editor.cycleUnitScheme();
    },

    moveCursor: function (newPosition) {
      this.editor.cursorMoved(newPosition);
    },

    updateDisplay: function (editableExpression) {
      var prefs = application.model.turo.prefs();
      var result = editableExpression.evalResult;
      var cursorPosition = editableExpression.cursorPosition;
      if (cursorPosition !== undefined) {
        this.cursorPosition = cursorPosition;
      }

      // t is a transferable object, defined in idl.
      var t = {
        id: result.id,
        cursorPosition: cursorPosition
      };
      var src = editableExpression.toString() || '',
          display = isUnderTest ? undefined : output.display;
      t.expressionToString = src;
      t.expressionLength = src.length;

      if (editableExpression.isParseable) {
        var resultToStringPrefs = {
          precisionType: "sf", 
          precisionDigits: 12, 
          useUnitRefactor: true,
          unitScheme: prefs.unitScheme,
          exponent: true, 
          prettyPrint: true
        };

        var errors = result.expressionErrors(),
            inError = errors && errors.length > 0;

        if (inError) {
          t.resultToString = 'Error';
        } else if (isUnderTest) {
          t.resultToString = result.valueToString(resultToStringPrefs);
        } else {
          t.resultToString = result.valueToHtml(resultToStringPrefs);
        }
      }

      t.expressionToString = editableExpression.toString(display);
      t.expressionIsString = false;
      t.cursorPosition = cursorPosition;
      t.autoSuffix = stringTimes(")", result.addedParens);

      t.identifierToString = result.identifierToString() || '';
      
      var identifierErrors = result.identifierErrors();
      if (identifierErrors) {
        t.identifierErrorToString = 'UMM';
      }

      t.unitScheme = prefs.unitScheme || 'Default';

      t.cursorPosition = t.cursorPosition || 0;
      // TODO this should be a method call.
      this.$native.displayStatement(t);
    },

    setEditorColor: function (colors) {
      this._colors = colors;
    },
  }
);

Object.defineProperties(EditorController.prototype, {
  lineToCursor: {
    get: function () {

    }
  },
  cursorPosition: {
    set: function (cursorPosition) {
      //this.$native.setCursorPosition(cursorPosition);
      this._cursorPosition = cursorPosition;
    },
    get: function () {
      return this._cursorPosition;
    }
  },

  statement: {
    set: function (statement) {
      this.updateDisplay(statement);
    }
  },

  isUnderTest: {
    set: function (bool) {
      isUnderTest = bool;
      if (bool) {
        testPadding = '|';
      } else {
        testPadding = undefined;
      }
    },
  },


});

module.exports = EditorController;